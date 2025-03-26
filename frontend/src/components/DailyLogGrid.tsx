import React from 'react';
import styled from 'styled-components';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  Legend
} from 'recharts';
import { LogSheet, DutyStatusChange } from '../types';

interface DailyLogGridProps {
  date: {
    month: string;
    day: string;
    year: string;
  };
  logs: LogSheet[];
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

const ChartContainer = styled.div`
  position: relative;
  height: 400px;
  border: 1px solid #000;
  margin: 20px 0;
  padding: 20px;
  background-color: #fff;
  display: flex;
`;

const ChartWrapper = styled.div`
  flex: 1;
  height: 100%;
`;

const StatusSummary = styled.div`
  width: 75px;
  height: 60%;
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
    font-size: 0.9em;

    .status-name {
      font-weight: bold;
    }

    .status-hours {
      color: #666;
    }
  }
`;

const RemarksChartContainer = styled.div`
  position: relative;
  height: 100px;
  border: 1px solid #000;
  margin: 20px 0;
  padding: 20px;
  background-color: #fff;
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
  logs,
  dutyStatusChanges,
}) => {
  const statusMap = {
    offDuty: 4,    // Top
    sleeper: 3,    // Second
    driving: 2,    // Third
    onDuty: 1,     // Bottom
    null: 0,
  };

  const statusLabels: Record<number, string> = {
    4: 'Off Duty',
    3: 'Sleeper Berth',
    2: 'Driving',
    1: 'On Duty (Not Driving)',
    0: '',
  };

  const getTimeLabel = (hour: number) => {
    if (hour === 0) return 'Midnight';
    if (hour === 12) return 'Noon';
    if (hour === 24) return 'Midnight';
    return `${hour}`;
  };

  const generateTimePoints = () => {
    const timePoints = [];
    for (let hour = 0; hour < 25; hour++) {
      timePoints.push({
        time: getTimeLabel(hour),
        hour: hour,
        status: 3
      });
    }
    return timePoints;
  };

  const calculateStatusHours = (data: any[]) => {
    const hours = {
      offDuty: 0,
      sleeper: 0,
      driving: 0,
      onDuty: 0,
    };

    data.forEach(point => {
      switch (point.status) {
        case 4: hours.offDuty++; break;
        case 3: hours.sleeper++; break;
        case 2: hours.driving++; break;
        case 1: hours.onDuty++; break;
      }
    });

    return hours;
  };

  const processDataForChart = () => {
    const timePoints = generateTimePoints();
    
    // Filter out any invalid duty status changes
    const validChanges = dutyStatusChanges.filter(change => 
      change && change.time && change.status
    );
    
    const sortedChanges = [...validChanges].sort((a, b) => {
      const timeA = new Date(a.time);
      const timeB = new Date(b.time);
      return timeA.getTime() - timeB.getTime();
    });

    // Initialize all time points with the first status (or default to sleeper)
    const defaultStatus = sortedChanges[0]?.status || 'null';
    timePoints.forEach(point => {
      point.status = statusMap[defaultStatus];
    });

    // Apply status changes to time points
    sortedChanges.forEach(change => {
      try {
        const changeTime = new Date(change.time);
        const hour = changeTime.getHours();
        if (hour >= 0 && hour < 24) {
          timePoints[hour].status = statusMap[change.status];
        }
      } catch (error) {
        console.error('Error processing duty status change:', error);
      }
    });

    return timePoints;
  };

  const processRemarksData = () => {
    const allRemarks = logs.flatMap(log => 
      (log.remarks || []).filter(remark => 
        remark && remark.time && remark.location
      )
    );
    return allRemarks.map(remark => ({
      time: getTimeLabel(parseInt(remark.time.split(':')[0])),
      remark: 1,
      location: remark.location
    }));
  };

  const data = processDataForChart();
  const statusHours = calculateStatusHours(data);

  // Get the first log's carrier and driver info
  const firstLog = logs[0];
  const totalMiles = logs.reduce((sum, log) => sum + log.total_miles_driving, 0);

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
          <div className="miles">{totalMiles}</div>
        </HeaderSection>
        <HeaderSection>
          <div className="title">VEHICLE NUMBERS—(SHOW EACH UNIT)</div>
          <div className="content">{firstLog?.vehicle_numbers || ''}</div>
        </HeaderSection>
      </Header>

      <CarrierInfo>
        <div className="carrier-name">{firstLog?.carrier_name || ''}</div>
        <div className="carrier-address">{firstLog?.carrier_address || ''}</div>
        <div className="driver-name">{firstLog?.driver_name || ''}</div>
      </CarrierInfo>

      <ChartContainer>
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%" >
            <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                interval={0}
                height={60}
                tickLine={false}
                tick={(props) => (
                  <g transform={`translate(${props.x},${props.y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={16}
                      textAnchor="end"
                      fill="#666"
                      transform="rotate(-45)"
                    >
                      {props.payload.value}
                    </text>
                  </g>
                )}
              />
              <YAxis 
                tickLine={false}
                tickFormatter={(tick: number) => statusLabels[tick] || ''}
                domain={[0, 4]}
              />
              <Tooltip 
                formatter={(value: number) => statusLabels[value] || ''}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line 
                type="stepAfter" 
                dataKey="status" 
                stroke="#0066cc" 
                strokeWidth={2}
                dot={{ fill: '#0066cc', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <StatusSummary>
          <div className="status-item">
            <span className="status-name">Off Duty</span>
            <span className="status-hours">{statusHours.offDuty} hrs</span>
          </div>
          <div className="status-item">
            <span className="status-name">Sleeper Berth</span>
            <span className="status-hours">{statusHours.sleeper} hrs</span>
          </div>
          <div className="status-item">
            <span className="status-name">Driving</span>
            <span className="status-hours">{statusHours.driving} hrs</span>
          </div>
          <div className="status-item">
            <span className="status-name">On Duty</span>
            <span className="status-hours">{statusHours.onDuty} hrs</span>
          </div>
        </StatusSummary>
      </ChartContainer>

      <RemarksSection>
        <div className="title">REMARKS</div>
        <RemarksChartContainer>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={processRemarksData()}>
              <XAxis
                dataKey="time"
                type="category"
                hide
              />
              <YAxis hide />
              <Scatter
                dataKey="remark"
                fill="#000"
                shape="triangle"
                legendType="none"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </RemarksChartContainer>
        {/* <div className="remarks-grid">
          {logs.flatMap(log => log.remarks).map((remark, index) => (
            <div key={index} className="remark-entry">
              <span className="time">{remark. time}</span>
              <span className="location">{remark.location}</span>
            </div>
          ))}
        </div> */}
      </RemarksSection>
    </GridContainer>
  );
};

export default DailyLogGrid; 