import React, { useState, useEffect } from 'react';
// Place this at the very top of App.jsx right under your imports
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ==========================================
// 1. THE HEADER COMPONENT
// ==========================================
function Header({ title }) {
  return (
    <header style={{ borderBottom: '2px solid #eee', marginBottom: '20px', paddingBottom: '10px' }}>
      <h1 style={{ color: '#2c3e50', margin: 0 }}>{title}</h1>
      <small style={{ color: '#27ae60', fontWeight: 'bold' }}>● Database Status: Connected</small>
    </header>
  );
}

// ==========================================
// 2. THE ATTENDANCE LIST COMPONENT
// ==========================================
function AttendanceList({ records }) {
  if (records.length === 0) {
    return <p>No employee records found in the database.</p>;
  }

  return (
    <div>
      <h3 style={{ color: '#34495e' }}>Active Rosters ({records.length})</h3>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {records.map((employee) => (
          <li 
            key={employee.id} 
            style={{
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f9f9f9'
            }}
          >
            <span style={{ fontWeight: '500' }}>{employee.name}</span>
            <span 
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: employee.isPresent ? '#2ecc71' : '#e74c3c'
              }}
            >
              {employee.isPresent ? 'Present' : 'Absent'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ==========================================
// 3. THE MASTER APP COMPONENT (The Orchestrator)
// ==========================================
export default function App() {
  // GLOBAL APPLICATION STATES
  const [attendanceData, setAttendanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // FORM CONTROLLER STATES
  const [newName, setNewName] = useState('');
  const [isPresentCheck, setIsPresentCheck] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FETCH EXECUTIONS (GET ALL)
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/attendance`);

        
        if (!response.ok) {
          throw new Error('Database server is not responding.');
        }
        
        const data = await response.json();
        setAttendanceData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  // SUBMIT HANDLER FUNCTION (POST REQUEST)
  const handleAddEmployee = async (event) => {
    event.preventDefault(); // Stop standard browser form submission reloads
    
    if (!newName.trim()) return; // Prevent empty input submissions

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/api/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newName,
          isPresent: isPresentCheck
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create new database entry.');
      }

      const rawNewRecord = await response.json();
      
      // Node.js returns an array containing the single added object row
      const newlyAddedEmployee = Array.isArray(rawNewRecord) ? rawNewRecord[0] : rawNewRecord;

      // UPDATE STATE MEMORY: Append new database record to existing UI list array
      setAttendanceData([...attendanceData, newlyAddedEmployee]);

      // RESET FORM: Clear user inputs back to default
      setNewName('');
      setIsPresentCheck(false);
    } catch (err) {
      alert(`⚠️ Submission Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <Header title="Real-Time Attendance Board" />

      {/* FORM INTERFACE LAYER */}
      <form onSubmit={handleAddEmployee} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fcfcfc' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Add New Employee Record</h4>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Enter employee name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={isSubmitting}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', flex: '1', minWidth: '200px' }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isPresentCheck}
              onChange={(e) => setIsPresentCheck(e.target.checked)}
              disabled={isSubmitting}
            />
            Mark Present
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !newName.trim()}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#3498db',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: (isSubmitting || !newName.trim()) ? 0.6 : 1
            }}
          >
            {isSubmitting ? 'Saving...' : 'Add Logs'}
          </button>
        </div>
      </form>

      {/* CONDITIONAL RENDER DISPLAYS */}
      {isLoading && <p style={{ color: '#666' }}>Connecting to API database...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>⚠️ Error: {error}</p>}

      {!isLoading && !error && (
        <AttendanceList records={attendanceData} />
      )}
    </div>
  );
}
