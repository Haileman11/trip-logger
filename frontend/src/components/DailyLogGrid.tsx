import React from 'react';
import styled from 'styled-components';

type DutyStatus = 'offDuty' | 'sleeper' | 'driving' | 'onDuty';

interface DutyStatusChange {
  time: string;
  status: DutyStatus;
  location: string;
  label?: string;
}

interface DailyLogGridProps {
  date: string;
  totalMilesDriving: number;
  totalMileageToday: number;
  carrierName: string;
  carrierAddress: string;
  homeTerminal: string;
  remarks: string;
  dutyStatusChanges: DutyStatusChange[];
}

const GridContainer = styled.div`
  font-family: Arial, sans-serif;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 20px;
`;

const DailyLogGrid: React.FC<DailyLogGridProps> = ({
  date,
  dutyStatusChanges,
  totalMilesDriving,
  totalMileageToday,
  carrierName,
  carrierAddress,
  homeTerminal,
  remarks,
}) => {
  const gridWidth = 1200;
  const gridHeight = 240;
  const statusHeight = gridHeight / 4;
  const hourWidth = gridWidth / 24;
  const margin = { top: 30, right: 100, bottom: 30, left: 100 };

  const statusColors = {
    offDuty: '#FFFFFF',
    sleeper: '#A8D1FF',
    driving: '#FFD700',
    onDuty: '#FFE4B5',
  };

  const statusLabels = {
    offDuty: 'Off Duty',
    sleeper: 'Sleeper Berth',
    driving: 'Driving',
    onDuty: 'On Duty',
  };

  const getTimePosition = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours + minutes / 60) * hourWidth;
  };

  const calculateTotalHours = (status: DutyStatus) => {
    let total = 0;
    let lastChangeTime: number | null = null;
    
    dutyStatusChanges
      .filter(change => change.status === status)
      .forEach(change => {
        const [hours, minutes] = change.time.split(':').map(Number);
        const timeInHours = hours + minutes / 60;
        
        if (lastChangeTime !== null) {
          total += timeInHours - lastChangeTime;
        }
        lastChangeTime = timeInHours;
      });
    
    return total.toFixed(2);
  };

  return (
    <GridContainer>
      <div style={{ marginBottom: '20px' }}>
        <h2>Day 1</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p>Carrier: {carrierName}</p>
            <p>Address: {carrierAddress}</p>
            <p>Home Terminal: {homeTerminal}</p>
          </div>
          <div>
            <p>Total Miles Driving: {totalMilesDriving}</p>
            <p>Total Mileage Today: {totalMileageToday}</p>
          </div>
        </div>
      </div>

      <svg
        width={gridWidth + margin.left + margin.right}
        height={gridHeight + margin.top + margin.bottom}
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Draw vertical hour lines */}
          {Array.from({ length: 25 }, (_, i) => (
            <g key={`hour-${i}`}>
              <line
                x1={i * hourWidth}
                y1={0}
                x2={i * hourWidth}
                y2={gridHeight}
                stroke="#000"
                strokeWidth={i % 6 === 0 ? 2 : 1}
              />
              <text
                x={i * hourWidth}
                y={-10}
                textAnchor="middle"
                fontSize="12"
              >
                {i === 12 ? 'Noon' : i === 0 ? 'Midnight' : i === 24 ? '24' : i.toString()}
              </text>
              {/* Draw quarter-hour marks */}
              {Array.from({ length: 3 }, (_, j) => (
                <line
                  key={`quarter-${i}-${j}`}
                  x1={i * hourWidth + ((j + 1) * hourWidth) / 4}
                  y1={0}
                  x2={i * hourWidth + ((j + 1) * hourWidth) / 4}
                  y2={gridHeight}
                  stroke="#000"
                  strokeWidth={0.5}
                  strokeDasharray="2,2"
                />
              ))}
            </g>
          ))}

          {/* Draw horizontal status lines */}
          {Object.entries(statusLabels).map(([status, label], i) => (
            <g key={`status-${status}`}>
              <rect
                y={i * statusHeight}
                width={gridWidth}
                height={statusHeight}
                fill={statusColors[status as DutyStatus]}
                stroke="#000"
              />
              <text
                x={-10}
                y={i * statusHeight + statusHeight / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="12"
              >
                {label}
              </text>
              <text
                x={gridWidth + 10}
                y={i * statusHeight + statusHeight / 2}
                dominantBaseline="middle"
                fontSize="12"
              >
                {calculateTotalHours(status as DutyStatus)}
              </text>
            </g>
          ))}

          {/* Draw duty status changes */}
          {dutyStatusChanges.map((change, i) => {
            const x = getTimePosition(change.time);
            const statusIndex = Object.keys(statusLabels).indexOf(change.status);
            const y = statusIndex * statusHeight;

            return (
              <g key={`change-${i}`}>
                {/* Draw vertical line for status change */}
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={gridHeight}
                  stroke="red"
                  strokeWidth={2}
                />
                {/* Add label if provided */}
                {change.label && (
                  <text
                    x={x}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill="red"
                  >
                    {change.label}
                  </text>
                )}
                {/* Add break label if provided */}
                {change.label?.startsWith('Break') && (
                  <rect
                    x={x}
                    y={statusIndex * statusHeight}
                    width={hourWidth * 2} // Assuming 2-hour break
                    height={statusHeight}
                    fill="white"
                    stroke="none"
                  >
                    <text
                      x={x + hourWidth}
                      y={statusIndex * statusHeight + statusHeight / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="10"
                    >
                      {change.label}
                    </text>
                  </rect>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div style={{ marginTop: '20px' }}>
        <h3>Remarks</h3>
        <p>{remarks}</p>
      </div>
    </GridContainer>
  );
};

export default DailyLogGrid; 