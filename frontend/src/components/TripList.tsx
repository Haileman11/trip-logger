import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { fetchTrips } from '../store/tripSlice';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';

const TripListContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const TripCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;

const TripHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const TripTitle = styled.h2`
  margin: 0;
  color: #333;
  font-size: 1.5rem;
`;

const TripDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`;

const DetailItem = styled.div`
  p {
    margin: 0;
    &:first-child {
      color: #666;
      font-size: 0.9rem;
    }
    &:last-child {
      color: #333;
      font-weight: 500;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled(Link)`
  padding: 8px 16px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;

  &.primary {
    background-color: #1976d2;
    color: white;
    &:hover {
      background-color: #1565c0;
    }
  }

  &.secondary {
    background-color: #f5f5f5;
    color: #333;
    &:hover {
      background-color: #e0e0e0;
    }
  }
`;

const NewTripButton = styled(Link)`
  display: inline-block;
  padding: 12px 24px;
  background-color: #2e7d32;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  margin-bottom: 24px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1b5e20;
  }
`;

const TripList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { trips, loading, error } = useAppSelector(state => state.trips);

  useEffect(() => {
    dispatch(fetchTrips());
  }, [dispatch]);

  if (loading) {
    return <div>Loading trips...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <TripListContainer>
      <TripHeader>
        <TripTitle>All Trips</TripTitle>
        <NewTripButton to="/new-trip">+ New Trip</NewTripButton>
      </TripHeader>

      {trips.map((trip) => (
        <TripCard key={trip.id}>
          <TripHeader>
            <TripTitle>Trip #{trip.id}</TripTitle>
            <div>{trip.status}</div>
          </TripHeader>

          <TripDetails>
            <DetailItem>
              <p>Current Location</p>
              <p>
                {trip.current_location
                  ? `${trip.current_location.latitude}, ${trip.current_location.longitude}`
                  : 'Not started'}
              </p>
            </DetailItem>
            <DetailItem>
              <p>Pickup Location</p>
              <p>
                {trip.pickup_location
                  ? `${trip.pickup_location.latitude}, ${trip.pickup_location.longitude}`
                  : 'Not set'}
              </p>
            </DetailItem>
            <DetailItem>
              <p>Dropoff Location</p>
              <p>
                {trip.dropoff_location
                  ? `${trip.dropoff_location.latitude}, ${trip.dropoff_location.longitude}`
                  : 'Not set'}
              </p>
            </DetailItem>
            <DetailItem>
              <p>Current Cycle Hours</p>
              <p>{trip.current_cycle_hours || '0'} hours</p>
            </DetailItem>
          </TripDetails>

          <ActionButtons>
            <Button to={`/trip/${trip.id}`} className="primary">
              View Details
            </Button>
            <Button to={`/trip/${trip.id}/logs`} className="secondary">
              Log Sheets
            </Button>
          </ActionButtons>
        </TripCard>
      ))}
    </TripListContainer>
  );
};

export default TripList; 