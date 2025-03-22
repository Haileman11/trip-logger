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
  date: {
    month: string;
    day: string;
    year: string;
  };
  totalMilesDriving: number;
  vehicleNumbers: string;
  carrierName: string;
  carrierAddress: string;
  driverName: string;
  remarks: { time: string; location: string }[];
  dutyStatusChanges: DutyStatusChange[];
}

const GridContainer = styled.div`
  font-family: Arial, sans-serif;
  background-color: white;
  border: 1px solid #000;
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
`;

const HeaderSection = styled.div`
  text-align: center;

  .title {
    font-size: 0.8em;
    color: #666;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .content {
    font-size: 1.2em;
    font-weight: bold;
    margin: 4px 0;
  }

  .subtitle {
    font-size: 0.7em;
    color: #666;
  }

  .date {
    font-size: 1.4em;
    font-weight: bold;
    margin: 8px 0;
  }

  .miles {
    font-size: 1.2em;
    font-weight: bold;
    margin: 4px 0;
  }
`;

const CarrierInfo = styled.div`
  margin: 20px 0;
  text-align: center;
  
  .carrier-name {
    font-size: 1.2em;
    font-weight: bold;
    margin-bottom: 4px;
    font-style: italic;
  }

  .carrier-address {
    font-size: 1em;
    margin-bottom: 8px;
    position: relative;
    
    &::before {
      content: "MAIN OFFICE ADDRESS";
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.7em;
      color: #666;
    }
  }

  .driver-name {
    font-size: 1.1em;
    font-weight: bold;
    font-style: italic;
    position: relative;
    
    &::before {
      content: "DRIVER\0027S SIGNATURE IN FULL";
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.7em;
      color: #666;
    }
  }
`;

const GridSection = styled.div`
  position: relative;
  height: 400px;
  border: 1px solid #000;
  margin: 20px 0;
  padding: 20px 140px;
  background-color: #fff;
`;

const TimeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  height: 100%;
  border-top: 1px solid #000;
  position: relative;
  background: repeating-linear-gradient(
    90deg,
    #f9f9f9,
    #f9f9f9 calc(100% / 24),
    #fff calc(100% / 24),
    #fff calc(200% / 24)
  );

  .hour-column {
    border-right: 1px solid #ddd;
    position: relative;
    
    &:nth-child(6n) {
      border-right: 1px solid #999;
    }

    .hour-label {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.7em;
      color: #666;
    }
  }
`;

const StatusLabels = styled.div`
  position: absolute;
  left: -120px;
  top: 0;
  height: 100%;
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  gap: 1px;
  font-size: 0.8em;
  
  div {
    display: flex;
    align-items: center;
    padding-right: 10px;
    height: 100%;
    font-weight: 500;
  }
`;

const TotalHours = styled.div`
  position: absolute;
  right: -50px;
  top: 0;
  height: 100%;
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  gap: 1px;
  font-size: 0.8em;
  
  div {
    display: flex;
    align-items: center;
    padding-left: 10px;
    height: 100%;
    font-weight: bold;
  }
`;

const StatusLine = styled.div<{ top: number; left: number; width: number }>`
  position: absolute;
  height: 2px;
  background-color: #0066cc;
  top: ${props => props.top}%;
  left: ${props => props.left}%;
  width: ${props => props.width}%;
`;

const VerticalLine = styled.div<{ left: number }>`
  position: absolute;
  width: 1px;
  background-color: #0066cc;
  height: 100%;
  left: ${props => props.left}%;
`;

const DateSection = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  gap: 5px;
  justify-content: center;
  align-items: center;
  margin-bottom: 5px;

  .date-label {
    font-size: 0.7em;
    color: #666;
    text-transform: uppercase;
    text-align: center;
  }

  .date-value {
    font-size: 1.4em;
    font-weight: bold;
    padding: 0 5px;
  }

  .date-separator {
    font-size: 1.4em;
    font-weight: bold;
    color: #666;
  }
`;

const RemarksSection = styled.div`
  margin-top: 20px;
  border: 1px solid #000;
  padding: 15px;

  .title {
    font-weight: bold;
    margin-bottom: 10px;
    font-size: 0.9em;
  }

  .remarks-grid {
    display: grid;
    gap: 8px;
    
    .remark-entry {
      display: grid;
      grid-template-columns: 80px 1fr;
      gap: 10px;
      font-size: 0.8em;
      
      .time {
        font-weight: 500;
      }
      
      .location {
        color: #333;
      }
    }
  }
`;

const DailyLogGrid: React.FC<DailyLogGridProps> = ({
  date,
  totalMilesDriving,
  vehicleNumbers,
  carrierName,
  carrierAddress,
  driverName,
  remarks,
  dutyStatusChanges,
}) => {
  const getTimePercentage = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return ((hours + minutes / 60) / 24) * 100;
  };

  const getStatusPosition = (status: DutyStatus) => {
    const positions = {
      offDuty: 12.5,
      sleeper: 37.5,
      driving: 62.5,
      onDuty: 87.5,
    };
    return positions[status];
  };

  const drawStatusLines = () => {
    const lines = [];
    for (let i = 0; i < dutyStatusChanges.length - 1; i++) {
      const current = dutyStatusChanges[i];
      const next = dutyStatusChanges[i + 1];
      
      const startTime = getTimePercentage(current.time);
      const endTime = getTimePercentage(next.time);
      const top = getStatusPosition(current.status);
      
      lines.push(
        <React.Fragment key={`line-${i}`}>
          <StatusLine
            top={top}
            left={startTime}
            width={endTime - startTime}
          />
          <VerticalLine left={startTime} />
        </React.Fragment>
      );
    }
    // Add final vertical line
    if (dutyStatusChanges.length > 0) {
      const lastChange = dutyStatusChanges[dutyStatusChanges.length - 1];
      lines.push(
        <VerticalLine
          key="final-line"
          left={getTimePercentage(lastChange.time)}
        />
      );
    }
    return lines;
  };

  return (
    <GridContainer>
      <Header>
        <HeaderSection>
          <div className="title">U.S. DEPARTMENT OF TRANSPORTATION</div>
          <div className="content">DRIVER'S DAILY LOG</div>
          <div className="subtitle">(ONE CALENDAR DAY — 24 HOURS)</div>
        </HeaderSection>
        <HeaderSection>
          <div className="title">DATE</div>
          <DateSection>
            <div>
              <div className="date-label">Month</div>
              <div className="date-value">{date.month}</div>
            </div>
            <div className="date-separator">/</div>
            <div>
              <div className="date-label">Day</div>
              <div className="date-value">{date.day}</div>
            </div>
            <div className="date-separator">/</div>
            <div>
              <div className="date-label">Year</div>
              <div className="date-value">{date.year}</div>
            </div>
          </DateSection>
          <div className="title">TOTAL MILES DRIVING TODAY</div>
          <div className="miles">{totalMilesDriving}</div>
        </HeaderSection>
        <HeaderSection>
          <div className="title">VEHICLE NUMBERS—(SHOW EACH UNIT)</div>
          <div className="content">{vehicleNumbers}</div>
        </HeaderSection>
      </Header>

      <CarrierInfo>
        <div className="carrier-name">{carrierName}</div>
        <div className="carrier-address">{carrierAddress}</div>
        <div className="driver-name">{driverName}</div>
      </CarrierInfo>

      <GridSection>
        <StatusLabels>
          <div>Off Duty</div>
          <div>Sleeper Berth</div>
          <div>Driving</div>
          <div>On Duty (Not Driving)</div>
        </StatusLabels>

        <TimeGrid>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="hour-column">
              <div className="hour-label">
                {i === 0 ? 'Midnight' : i === 12 ? 'Noon' : i}
              </div>
            </div>
          ))}
          {drawStatusLines()}
        </TimeGrid>

        <TotalHours>
          <div>10</div>
          <div>1.75</div>
          <div>7.75</div>
          <div>4.5</div>
        </TotalHours>
      </GridSection>

      <RemarksSection>
        <div className="title">REMARKS</div>
        <div className="remarks-grid">
          {remarks.map((remark, index) => (
            <div key={index} className="remark-entry">
              <span className="time">{remark.time}</span>
              <span className="location">{remark.location}</span>
            </div>
          ))}
        </div>
      </RemarksSection>
    </GridContainer>
  );
};

export default DailyLogGrid; 