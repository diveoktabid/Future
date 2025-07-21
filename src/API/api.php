<?php
// ============================================================================
// BARTECH PHP API - Backend untuk React Frontend
// File: api.php
// Simpan di folder: C:/xampp/htdocs/bartech-api/api.php (untuk XAMPP)
// ============================================================================

// Enable error reporting untuk development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS Headers untuk React development
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================
class Database {
    private $host = "localhost";
    private $db_name = "bartech";        // Nama database Anda
    private $username = "root";          // Username database
    private $password = "";              // Password database (kosong untuk XAMPP default)
    private $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password,
                array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8")
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo json_encode([
                "success" => false,
                "message" => "Connection error: " . $exception->getMessage()
            ]);
            exit();
        }
        return $this->conn;
    }
}

// ============================================================================
// USER CLASS
// ============================================================================
class User {
    private $conn;
    private $table_name = "users";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Register user baru
    public function register($first_name, $last_name, $email, $phone_number, $password) {
        try {
            // Check if email already exists
            $check_query = "SELECT user_id FROM " . $this->table_name . " WHERE email = :email LIMIT 1";
            $check_stmt = $this->conn->prepare($check_query);
            $check_stmt->bindParam(":email", $email);
            $check_stmt->execute();

            if ($check_stmt->rowCount() > 0) {
                return [
                    "success" => false,
                    "message" => "Email sudah terdaftar. Silakan gunakan email lain."
                ];
            }

            // Hash password
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);

            // Insert new user
            $query = "INSERT INTO " . $this->table_name . " 
                     SET first_name = :first_name,
                         last_name = :last_name,
                         email = :email,
                         phone_number = :phone_number,
                         password = :password";

            $stmt = $this->conn->prepare($query);

            // Bind parameters
            $stmt->bindParam(":first_name", $first_name);
            $stmt->bindParam(":last_name", $last_name);
            $stmt->bindParam(":email", $email);
            $stmt->bindParam(":phone_number", $phone_number);
            $stmt->bindParam(":password", $hashed_password);

            if ($stmt->execute()) {
                $user_id = $this->conn->lastInsertId();
                
                return [
                    "success" => true,
                    "message" => "Registrasi berhasil! Silakan login dengan akun Anda.",
                    "user" => [
                        "user_id" => $user_id,
                        "first_name" => $first_name,
                        "last_name" => $last_name,
                        "email" => $email,
                        "phone_number" => $phone_number
                    ]
                ];
            } else {
                return [
                    "success" => false,
                    "message" => "Gagal mendaftar. Silakan coba lagi."
                ];
            }

        } catch (PDOException $exception) {
            return [
                "success" => false,
                "message" => "Database error: " . $exception->getMessage()
            ];
        }
    }

    // Login user
    public function login($email, $password) {
        try {
            $query = "SELECT user_id, first_name, last_name, email, phone_number, password 
                     FROM " . $this->table_name . " 
                     WHERE email = :email LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":email", $email);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);

                if (password_verify($password, $row['password'])) {
                    // Update last login (optional)
                    $this->updateLastLogin($row['user_id']);

                    return [
                        "success" => true,
                        "message" => "Login berhasil! Selamat datang, " . $row['first_name'],
                        "user" => [
                            "user_id" => $row['user_id'],
                            "first_name" => $row['first_name'],
                            "last_name" => $row['last_name'],
                            "email" => $row['email'],
                            "phone_number" => $row['phone_number']
                        ]
                    ];
                } else {
                    return [
                        "success" => false,
                        "message" => "Password salah. Silakan coba lagi."
                    ];
                }
            } else {
                return [
                    "success" => false,
                    "message" => "Email tidak ditemukan. Silakan daftar terlebih dahulu."
                ];
            }

        } catch (PDOException $exception) {
            return [
                "success" => false,
                "message" => "Database error: " . $exception->getMessage()
            ];
        }
    }

    // Update last login timestamp
    private function updateLastLogin($user_id) {
        try {
            // Jika Anda menambahkan kolom last_login di database
            $query = "UPDATE " . $this->table_name . " 
                     SET last_login = NOW() 
                     WHERE user_id = :user_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":user_id", $user_id);
            $stmt->execute();
        } catch (PDOException $exception) {
            // Silent fail, tidak critical
            error_log("Update last login failed: " . $exception->getMessage());
        }
    }

    // Update user profile
    public function updateProfile($user_id, $first_name, $last_name, $phone_number) {
        try {
            $query = "UPDATE " . $this->table_name . " 
                     SET first_name = :first_name,
                         last_name = :last_name,
                         phone_number = :phone_number
                     WHERE user_id = :user_id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":first_name", $first_name);
            $stmt->bindParam(":last_name", $last_name);
            $stmt->bindParam(":phone_number", $phone_number);
            $stmt->bindParam(":user_id", $user_id);

            if ($stmt->execute()) {
                return [
                    "success" => true,
                    "message" => "Profile berhasil diupdate!"
                ];
            } else {
                return [
                    "success" => false,
                    "message" => "Gagal update profile."
                ];
            }

        } catch (PDOException $exception) {
            return [
                "success" => false,
                "message" => "Database error: " . $exception->getMessage()
            ];
        }
    }

    // Get user by ID
    public function getUserById($user_id) {
        try {
            $query = "SELECT user_id, first_name, last_name, email, phone_number 
                     FROM " . $this->table_name . " 
                     WHERE user_id = :user_id LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":user_id", $user_id);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                return $stmt->fetch(PDO::FETCH_ASSOC);
            }
            return false;

        } catch (PDOException $exception) {
            return false;
        }
    }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Initialize database connection
$database = new Database();
$db = $database->getConnection();
$user = new User($db);

// Get JSON input
$input = json_decode(file_get_contents("php://input"), true);
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Routing berdasarkan action parameter
switch ($action) {

    // ================================
    // REGISTER ENDPOINT
    // ================================
    case 'register':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Method not allowed"]);
            break;
        }

        $first_name = trim($input['firstName'] ?? '');
        $last_name = trim($input['lastName'] ?? '');
        $email = trim($input['email'] ?? '');
        $phone_number = trim($input['phoneNumber'] ?? '');
        $password = $input['password'] ?? '';

        // Basic validation
        if (empty($first_name) || empty($last_name) || empty($email) || empty($phone_number) || empty($password)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Semua field harus diisi"
            ]);
            break;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Format email tidak valid"
            ]);
            break;
        }

        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Password minimal 6 karakter"
            ]);
            break;
        }

        $result = $user->register($first_name, $last_name, $email, $phone_number, $password);
        
        if ($result['success']) {
            http_response_code(201);
        } else {
            http_response_code(400);
        }
        
        echo json_encode($result);
        break;

    // ================================
    // LOGIN ENDPOINT
    // ================================
    case 'login':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Method not allowed"]);
            break;
        }

        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Email dan password harus diisi"
            ]);
            break;
        }

        $result = $user->login($email, $password);
        
        if ($result['success']) {
            http_response_code(200);
        } else {
            http_response_code(401);
        }
        
        echo json_encode($result);
        break;

    // ================================
    // UPDATE PROFILE ENDPOINT
    // ================================
    case 'update_profile':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Method not allowed"]);
            break;
        }

        $user_id = $input['user_id'] ?? '';
        $first_name = trim($input['firstName'] ?? '');
        $last_name = trim($input['lastName'] ?? '');
        $phone_number = trim($input['phoneNumber'] ?? '');

        if (empty($user_id) || empty($first_name) || empty($last_name) || empty($phone_number)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Semua field harus diisi"
            ]);
            break;
        }

        $result = $user->updateProfile($user_id, $first_name, $last_name, $phone_number);
        echo json_encode($result);
        break;

    // ================================
    // AUTO LOGIN ENDPOINT (Optional)
    // ================================
    case 'auto_login':
        // Implementasi auto login dengan remember token
        // Untuk saat ini return false karena belum ada remember token di database
        echo json_encode([
            "success" => false,
            "message" => "Auto login not implemented yet"
        ]);
        break;

    // ================================
    // TEST CONNECTION ENDPOINT
    // ================================
    case 'test':
        echo json_encode([
            "success" => true,
            "message" => "API connection successful!",
            "timestamp" => date('Y-m-d H:i:s'),
            "server" => $_SERVER['SERVER_NAME']
        ]);
        break;

    // ================================
    // DEFAULT / INVALID ACTION
    // ================================
    default:
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "API endpoint not found",
            "available_actions" => ["register", "login", "update_profile", "test"]
        ]);
        break;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Sanitize input
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Validate email format
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Generate random token (untuk remember me feature)
function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}

?>