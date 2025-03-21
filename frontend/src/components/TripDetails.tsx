import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { LatLngBounds, latLng, LatLngTuple } from 'leaflet';
import { fetchTrip } from '../store/tripSlice';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import '../utils/leaflet-icons';
import 'leaflet/dist/leaflet.css';

const DetailsContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  margin: 0;
  color: #333;
`;

const MapSection = styled.div`
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  height: 400px;

  .leaflet-container {
    height: 100%;
    border-radius: 8px;
  }
`;

const InfoSection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 24px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
`;

const InfoItem = styled.div`
  h3 {
    margin: 0 0 8px 0;
    color: #666;
    font-size: 0.9rem;
    text-transform: uppercase;
  }
  p {
    margin: 0;
    color: #333;
    font-size: 1.1rem;
    font-weight: 500;
  }
`;

const StopsList = styled.div`
  margin-top: 24px;
`;

const StopItem = styled.div`
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 12px;
  
  h4 {
    margin: 0 0 8px 0;
    color: #333;
  }
  
  p {
    margin: 4px 0;
    color: #666;
  }
`;

const Button = styled(Link)`
  padding: 8px 16px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;
  background-color: #1976d2;
  color: white;
  
  &:hover {
    background-color: #1565c0;
  }
`;

const TripDetails: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const dispatch = useAppDispatch();
  const { currentTrip: trip, loading, error } = useAppSelector(state => state.trips);

  useEffect(() => {
    if (tripId) {
      dispatch(fetchTrip(tripId));
    }
  }, [dispatch, tripId]);

  if (loading) {
    return <div>Loading trip details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!trip) {
    return <div>Trip not found</div>;
  }

  // Create array of coordinates for the polyline
  const coordinates: LatLngTuple[] = [];
  if (trip.pickup_location) {
    coordinates.push([trip.pickup_location.latitude, trip.pickup_location.longitude]);
  }
  if (trip.stops) {
    trip.stops.forEach(stop => {
      coordinates.push([stop.location.latitude, stop.location.longitude]);
    });
  }
  if (trip.dropoff_location) {
    coordinates.push([trip.dropoff_location.latitude, trip.dropoff_location.longitude]);
  }

  // Calculate bounds for the map
  const bounds = coordinates.length > 0
    ? new LatLngBounds(coordinates.map(coord => latLng(coord[0], coord[1])))
    : new LatLngBounds([[0, 0], [0, 0]]);

  return (
    <DetailsContainer>
      <Header>
        <Title>Trip #{trip.id}</Title>
        <Button to="/">Back to Trips</Button>
      </Header>

      <MapSection>
        <MapContainer bounds={bounds} scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {trip.current_location && (
            <Marker 
              position={[trip.current_location.latitude, trip.current_location.longitude] as LatLngTuple}
            >
              <Popup>Current Location</Popup>
            </Marker>
          )}
          
          {trip.pickup_location && (
            <Marker 
              position={[trip.pickup_location.latitude, trip.pickup_location.longitude] as LatLngTuple}
            >
              <Popup>Pickup Location</Popup>
            </Marker>
          )}
          
          {trip.dropoff_location && (
            <Marker 
              position={[trip.dropoff_location.latitude, trip.dropoff_location.longitude] as LatLngTuple}
            >
              <Popup>Dropoff Location</Popup>
            </Marker>
          )}
          
          {coordinates.length > 1 && (
            <Polyline positions={coordinates} color="blue" />
          )}
        </MapContainer>
      </MapSection>

      <InfoSection>
        <InfoGrid>
          <InfoItem>
            <h3>Status</h3>
            <p>{trip.status}</p>
          </InfoItem>
          <InfoItem>
            <h3>Current Cycle Hours</h3>
            <p>{trip.current_cycle_hours || '0'} hours</p>
          </InfoItem>
          <InfoItem>
            <h3>Current Location</h3>
            <p>
              {trip.current_location
                ? `${trip.current_location.latitude}, ${trip.current_location.longitude}`
                : 'Not started'}
            </p>
          </InfoItem>
          <InfoItem>
            <h3>Pickup Location</h3>
            <p>
              {trip.pickup_location
                ? `${trip.pickup_location.latitude}, ${trip.pickup_location.longitude}`
                : 'Not set'}
            </p>
          </InfoItem>
          <InfoItem>
            <h3>Dropoff Location</h3>
            <p>
              {trip.dropoff_location
                ? `${trip.dropoff_location.latitude}, ${trip.dropoff_location.longitude}`
                : 'Not set'}
            </p>
          </InfoItem>
        </InfoGrid>

        {trip.stops && trip.stops.length > 0 && (
          <StopsList>
            <h3>Stops</h3>
            {trip.stops.map((stop, index) => (
              <StopItem key={index}>
                <h4>Stop #{index + 1}</h4>
                <p>Location: {stop.location.latitude}, {stop.location.longitude}</p>
                {stop.arrival_time && <p>Arrival: {new Date(stop.arrival_time).toLocaleString()}</p>}
                {stop.departure_time && <p>Departure: {new Date(stop.departure_time).toLocaleString()}</p>}
                <p>Status: {stop.status}</p>
              </StopItem>
            ))}
          </StopsList>
        )}
      </InfoSection>
    </DetailsContainer>
  );
};

export default TripDetails; 