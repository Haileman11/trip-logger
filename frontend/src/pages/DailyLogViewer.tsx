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
  console.log(logSheets);
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
              month: format(parseISO(date || ''), 'MM'),
              day: format(parseISO(date || ''), 'dd'), 
              year: format(parseISO(date || ''), 'yyyy')
            }}
            logs={dailyLogs}
            dutyStatusChanges={dailyLogs.map((log) => log.duty_status_changes).flat()}
          />
        </div>
      )}
    </div>
  );
};

export default DailyLogViewer; 