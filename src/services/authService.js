// Mock user database for demonstration
export const users = [
  {
    id: 1,
    name: "Reza Aditya",
    email: "admin@bartech.id",
    password: "admin123",
    role: "Admin",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format",
  },
  {
    id: 2,
    name: "Dr. Sarah Johnson",
    email: "sarah@bartech.id",
    password: "doctor123",
    role: "Doctor",
    avatar:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop&crop=face&auto=format",
  },
  {
    id: 3,
    name: "John Smith",
    email: "john@bartech.id",
    password: "nurse123",
    role: "Nurse",
    avatar:
      "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=40&h=40&fit=crop&crop=face&auto=format",
  },
];

// Authentication service
export const authService = {
  login: (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users.find(
          (u) => u.email === email && u.password === password
        );
        if (user) {
          const { password, ...userWithoutPassword } = user;
          resolve(userWithoutPassword);
        } else {
          reject(new Error("Invalid email or password"));
        }
      }, 1000);
    });
  },

  logout: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  },
};
