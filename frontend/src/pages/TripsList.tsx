import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { fetchTrips, deleteTrip } from "../store/slices/tripSlice";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Search, Trash2, Eye, Play, MapPin, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Trip } from "../types";

export default function TripsList() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {trips,loading,error} = useSelector((state: RootState) => state.trips);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchTrips({ page: 1, sortBy: "id", sortOrder: "desc" }));
    console.log(trips)
  }, [dispatch]);

  const handleDelete = async (tripId: string) => {
    if (window.confirm("Are you sure you want to delete this trip?")) {
      try {
        await dispatch(deleteTrip(tripId)).unwrap();
        dispatch(fetchTrips({ page: 1, sortBy: "id", sortOrder: "desc" }));
      } catch (error) {
        console.error("Failed to delete trip:", error);
      }
    }
  };

  const filteredTrips = trips.filter((trip: Trip) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      trip.id.toString().includes(searchLower) ||
      trip.status.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: Trip["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "planned":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDistance = (meters: number): string => {
    const miles = (meters / 1609.34).toFixed(1);
    return `${miles} miles`;
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trips</h1>
          <p className="text-gray-500 mt-1">Manage and monitor your trips</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <Button onClick={() => navigate("/trip/new")} className="bg-blue-600 hover:bg-blue-700">
            New Trip
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Driver</TableHead>
              <TableHead className="font-semibold">Created At</TableHead>
              <TableHead className="font-semibold">From</TableHead>
              <TableHead className="font-semibold">To</TableHead>
              <TableHead className="font-semibold">Current Location</TableHead>
              <TableHead className="font-semibold">Cycle Hours</TableHead>
              <TableHead className="w-[100px] font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrips.map((trip: Trip) => (
              <TableRow key={trip.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">#{trip.id}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(trip.status)}>
                    {trip.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  {trip.created_by
                    ? `${trip.created_by.first_name} ${trip.created_by.last_name}`
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    {trip.created_at
                      ? format(parseISO(trip.created_at), "MMM d, yyyy HH:mm")
                      : "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    {trip.route?.routes?.[0].legs?.[0].summary }
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    {  trip.route?.routes?.[0].legs[trip.route?.routes?.[0].legs.length-1].summary || "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {trip.current_location.latitude?.toFixed(4)},{" "}
                    {trip.current_location.longitude?.toFixed(4)}
                  </div>
                </TableCell>
                <TableCell>{trip.current_cycle_hours?.toFixed(1)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>                    
                        <MoreHorizontal className="h-4 w-4" />                     
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => navigate(`/trip/${trip.id}`)}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {trip.status === "planned" && (
                        <DropdownMenuItem
                          onClick={() => navigate(`/trip/${trip.id}/live`)}
                          className="cursor-pointer"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start Trip
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(trip.id.toString())}
                        className="text-red-600 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Trip
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredTrips.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No trips found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
