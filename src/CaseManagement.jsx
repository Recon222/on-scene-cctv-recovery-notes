import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, MoreVertical, ChevronRight } from 'lucide-react';
import { useLocalStorage, useRecentOCC } from './hooks/usePWA';

const CaseManagement = ({ onNewCase }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cases, setCases] = useLocalStorage('videoRecoveryCases', []);
  const { recentOCCs } = useRecentOCC();

  // Custom styles
  const styles = {
    button: {
      backgroundColor: '#2563eb',
      borderColor: '#2563eb',
      '&:hover': {
        backgroundColor: '#1d4ed8',
        borderColor: '#1d4ed8'
      }
    },
    card: {
      borderRadius: '1rem',
      border: 'none'
    },
    searchContainer: {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      borderRadius: '0.5rem',
      overflow: 'hidden'
    }
  };

  // Filter cases based on search term
  const filteredCases = cases.filter(caseItem => 
    caseItem.occ.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caseItem.locations.some(loc => 
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="container pt-4 pb-3">
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="display-6 fw-bold mb-0">Video Recovery Notes</h1>
          <button 
            className="btn btn-primary btn-lg d-flex align-items-center gap-2"
            onClick={onNewCase}
            style={styles.button}
          >
            <Plus size={20} />
            New Case
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="container mb-4">
        <div className="input-group input-group-lg" style={styles.searchContainer}>
          <span className="input-group-text bg-white border-end-0">
            <Search className="text-muted" size={20} />
          </span>
          <input
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Search cases and locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Recent Cases */}
      <div className="container mb-4">
        {filteredCases.length === 0 && searchTerm === '' ? (
          <div className="card shadow-sm">
            <div className="card-body text-center py-5">
              <FileText size={48} className="mb-3 text-primary opacity-75" />
              <h2 className="h4 mb-3">Welcome to Video Recovery Notes</h2>
              <p className="text-muted mb-4">Get started by creating your first case:</p>
              <div className="d-flex flex-column gap-3 align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>1</div>
                  <span className="text-start">Click "New Case" to begin a new video recovery document</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>2</div>
                  <span className="text-start">Fill in the case details and location information</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>3</div>
                  <span className="text-start">Generate and export your completed notes</span>
                </div>
                <button 
                  className="btn btn-primary btn-lg mt-4 d-flex align-items-center gap-2"
                  onClick={onNewCase}
                >
                  <Plus size={20} />
                  Start New Case
                </button>
              </div>
            </div>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center text-muted py-5">
            <Search size={48} className="mb-3 opacity-50" />
            <h2 className="h5">No matching cases found</h2>
            <p>Try adjusting your search terms</p>
          </div>
        ) : (
          filteredCases.map((caseItem, index) => (
            <div 
              className="card mb-4 shadow-sm" 
              key={caseItem.occ}
              style={styles.card}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2 text-primary">
                    <FileText size={20} />
                    <span className="fs-5">{caseItem.occ}</span>
                  </div>
                  <div className="dropdown">
                    <button 
                      className="btn btn-link p-0" 
                      type="button"
                      id={`case-${index}-options`}
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <MoreVertical size={20} />
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={`case-${index}-options`}>
                      <li><button className="dropdown-item" onClick={() => onEditCase(caseItem.occ)}>Edit</button></li>
                      <li><button className="dropdown-item" onClick={() => onExportPDF(caseItem.occ)}>Export PDF</button></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><button className="dropdown-item text-danger" onClick={() => onDeleteCase(caseItem.occ)}>Delete</button></li>
                    </ul>
                  </div>
                </div>

                {caseItem.unit && (
                  <h2 className="h5 text-muted mb-4">{caseItem.unit}</h2>
                )}

                {/* Location Items */}
                <div className="list-group list-group-flush">
                  {caseItem.locations.map((location, locIndex) => (
                    <a
                      key={locIndex}
                      href="#"
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3"
                      onClick={(e) => {
                        e.preventDefault();
                        onEditLocation(caseItem.occ, location);
                      }}
                    >
                      <div>
                        <h3 className="h6 mb-1">{location.name}</h3>
                        <p className="text-muted small mb-0">{location.address}</p>
                      </div>
                      <ChevronRight size={20} className="text-muted" />
                    </a>
                  ))}
                </div>

                <button 
                  className="btn btn-link text-primary d-flex align-items-center gap-2 mt-3"
                  onClick={() => onAddLocation(caseItem.occ)}
                >
                  <Plus size={20} />
                  Add Location
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CaseManagement;