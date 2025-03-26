import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchLogSheets } from '../store/slices/logSlice';
import type { RootState, AppDispatch } from '../store';
import { format, parseISO } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import DailyLogGrid from '@/components/DailyLogGrid';

const DailyLogViewer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  const { logSheets, loading, error } = useSelector((state: RootState) => state.logs);

  useEffect(() => {
    dispatch(fetchLogSheets("all"))
      .unwrap()
      .then((data) => {
        console.log('Fetched log sheets:', data);
      })
      .catch((error) => {
        console.error('Error fetching log sheets:', error);
      });
  }, [dispatch]);

  // Filter logs for the selected date
  const dailyLogs = logSheets.filter((log) => {
    const logDate = format(parseISO(log.start_time), 'yyyy-MM-dd');
    return logDate === date;
  });

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
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/logs')}
          className="hover:bg-transparent"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Logs
        </Button>
        <h1 className="text-3xl font-bold">
          Logs for {format(parseISO(date || ''), 'MMMM d, yyyy')}
        </h1>
      </div>

      {dailyLogs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Logs Found</CardTitle>
            <CardDescription>
              There are no logs recorded for this date.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6">
          <DailyLogGrid
                date={{
                  month: "04",
                  day: "09",
                  year: "2021",
                }}
                totalMilesDriving={350}
                vehicleNumbers="123, 20544"
                carrierName="John Doe's Transportation"
                carrierAddress="Washington, D.C."
                driverName="John E. Doe"
                remarks={[
                  { time: "04:00", location: "Richmond, VA" },
                  { time: "07:00", location: "Fredericksburg, VA" },
                  { time: "10:00", location: "Baltimore, MD" },
                  { time: "13:00", location: "Philadelphia, PA" },
                  { time: "16:00", location: "Cherry Hill, NJ" },
                  { time: "19:00", location: "Newark, NJ" },
                ]}
                dutyStatusChanges={[
                  { time: "00:00", status: "offDuty", location: "Start" },
                  { time: "04:00", status: "driving", location: "Richmond" },
                  { time: "06:00", status: "onDuty", location: "Break" },
                  { time: "07:00", status: "driving", location: "Resume" },
                  { time: "10:00", status: "onDuty", location: "Baltimore" },
                  { time: "11:00", status: "driving", location: "Resume" },
                  {
                    time: "13:00",
                    status: "sleeper",
                    location: "Philadelphia",
                  },
                  { time: "15:00", status: "driving", location: "Resume" },
                  { time: "17:00", status: "onDuty", location: "Break" },
                  { time: "18:00", status: "driving", location: "Resume" },
                  { time: "20:00", status: "offDuty", location: "End" },
                ]}
              />
          {dailyLogs.map((log) => (
            <div key={log.id}>
                <div className="flex justify-between items-center">
                  
                  <Badge
                    variant="outline"
                    className={
                      log.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : log.status === 'completed'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-gray-50 text-gray-700'
                    }
                  >
                    {log.status}
                  </Badge>
                </div>
              
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Start Time</p>
                    <p className="mt-1">
                      {format(parseISO(log.start_time), 'h:mm a')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">End Time</p>
                    <p className="mt-1">
                      {log.end_time
                        ? format(parseISO(log.end_time), 'h:mm a')
                        : 'In Progress'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Start Cycle Hours
                    </p>
                    <p className="mt-1">{log.start_cycle_hours}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      End Cycle Hours
                    </p>
                    <p className="mt-1">
                      {log.end_cycle_hours || 'Not completed'}
                    </p>
                  </div>
                </div>
                {log.trip && (
                  <div className="mt-4">
                    <Link
                      to={`/trip/${log.trip}/log-sheet/${log.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                )}
              </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyLogViewer; 