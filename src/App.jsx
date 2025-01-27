import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import CaseManagement from './components/CaseManagement';
import CaseForm from './components/CaseForm';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/case-management.css';
import './styles/mobile.css';

const App = () => {
  return (
    <BrowserRouter basename="/">
      <div className="app-container">
        <Routes>
          <Route index element={<CaseManagementWrapper />} />
          <Route path="case/new" element={<CaseFormWrapper />} />
          <Route path="case/:occ" element={<CaseFormWrapper />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

// Wrapper component to handle navigation for CaseManagement
const CaseManagementWrapper = () => {
  const navigate = useNavigate();

  const handleNewCase = () => {
    navigate('/case/new');
  };

  const handleEditCase = (occ) => {
    navigate(`/case/${occ}`);
  };

  const handleExportPDF = (occ) => {
    // Implement PDF export logic
    console.log('Exporting PDF for case:', occ);
  };

  const handleDeleteCase = (occ) => {
    // Implement delete logic with confirmation
    if (window.confirm('Are you sure you want to delete this case?')) {
      const cases = JSON.parse(localStorage.getItem('videoRecoveryCases') || '[]');
      const updatedCases = cases.filter(c => c.occ !== occ);
      localStorage.setItem('videoRecoveryCases', JSON.stringify(updatedCases));
      // Remove the form data for this case
      localStorage.removeItem(`formData_${occ}`);
      // Force a re-render
      window.location.reload();
    }
  };

  return (
    <CaseManagement 
      onNewCase={handleNewCase}
      onEditCase={handleEditCase}
      onExportPDF={handleExportPDF}
      onDeleteCase={handleDeleteCase}
    />
  );
};

// Wrapper component to handle navigation for CaseForm
const CaseFormWrapper = () => {
  const navigate = useNavigate();
  const { occ } = useParams();

  const handleSave = (formData) => {
    // Get existing cases
    const cases = JSON.parse(localStorage.getItem('videoRecoveryCases') || '[]');
    
    // Create or update case
    const caseData = {
      occ: formData.occ || occ,
      unit: formData.unit,
      locations: [{
        name: formData.dvrLocation || 'Primary Location',
        address: formData.address
      }]
    };

    const existingCaseIndex = cases.findIndex(c => c.occ === caseData.occ);
    if (existingCaseIndex >= 0) {
      cases[existingCaseIndex] = caseData;
    } else {
      cases.push(caseData);
    }

    // Save updated cases
    localStorage.setItem('videoRecoveryCases', JSON.stringify(cases));

    // Navigate back to case list
    navigate('/');
  };

  return (
    <CaseForm 
      occ={occ}
      onSave={handleSave}
    />
  );
};

export default App;