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
import { MoreHorizontal, Search, Trash2, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Trip } from "../types";

export default function TripsList() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const trips = useSelector((state: RootState) => state.trips.trips);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchTrips({ page: 1, sortBy: "id", sortOrder: "desc" }));
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
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "planned":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trips</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => navigate("/trip/new")}>New Trip</Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Current Location</TableHead>
              <TableHead>Cycle Hours</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrips.map((trip: Trip) => (
              <TableRow key={trip.id}>
                <TableCell className="font-medium">#{trip.id}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(trip.status)}>
                    {trip.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {trip.created_by
                    ? `${trip.created_by.first_name} ${trip.created_by.last_name}`
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {trip.created_at
                    ? format(parseISO(trip.created_at), "MMM d, yyyy HH:mm")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {trip.current_location.latitude?.toFixed(4)},{" "}
                  {trip.current_location.longitude?.toFixed(4)}
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
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {trip.status === "planned" && (
                        <DropdownMenuItem
                          onClick={() => navigate(`/trip/${trip.id}/live`)}
                        >
                          Start Trip
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(trip.id.toString())}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Trip
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
