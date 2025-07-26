import React, { useState } from 'react';
import LoginSuccessModal from './LoginSuccessModal';

const ModalDemo = () => {
  const [showModal, setShowModal] = useState(false);
  const [userName, setUserName] = useState('John Doe');

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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Login Success Modal Demo
        </h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Name:
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter user name"
            />
          </div>
          
          <button
            onClick={handleShowModal}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Show Login Success Modal
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Props:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><code className="bg-gray-200 px-1 rounded">isOpen</code>: {showModal.toString()}</li>
            <li><code className="bg-gray-200 px-1 rounded">userName</code>: "{userName}"</li>
            <li><code className="bg-gray-200 px-1 rounded">onClose</code>: Function</li>
            <li><code className="bg-gray-200 px-1 rounded">onContinue</code>: Function</li>
          </ul>
        </div>
      </div>

      <LoginSuccessModal
        isOpen={showModal}
        onClose={handleCloseModal}
        userName={userName}
        onContinue={handleContinue}
      />
    </div>
  );
};

export default ModalDemo;
