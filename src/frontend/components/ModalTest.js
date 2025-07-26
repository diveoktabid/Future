import React, { useState } from 'react';
import LoginSuccessModal from '../components/LoginSuccessModal';

const ModalTest = () => {
  const [showModal, setShowModal] = useState(false);

  const handleShowModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleContinue = () => {
    setShowModal(false);
    alert('Redirecting to dashboard...');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#1f2937', 
          marginBottom: '16px' 
        }}>
          Login Success Modal Test
        </h1>
        
        <p style={{ 
          color: '#6b7280', 
          marginBottom: '32px' 
        }}>
          Click the button below to see the login success modal in action
        </p>
        
        <button
          onClick={handleShowModal}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 24px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Show Login Success Modal
        </button>
      </div>

      <LoginSuccessModal
        isOpen={showModal}
        onClose={handleCloseModal}
        userName="Dive masachika"
        onContinue={handleContinue}
      />
    </div>
  );
};

export default ModalTest;
