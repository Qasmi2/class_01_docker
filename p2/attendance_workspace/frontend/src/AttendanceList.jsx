import React from 'react';

function AttendanceList({ records }) {
  if (records.length === 0) {
    return <p>No employee records stored in this database instance.</p>;
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

export default AttendanceList;
