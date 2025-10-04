import React from 'react';
import { ClimoResponse } from '../api';

interface ResultCardProps {
  data: ClimoResponse;
  lat: number;
  lon: number;
  date: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ data, lat, lon, date }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRainLevel = (pop: number): { level: string; color: string; bgColor: string } => {
    if (pop < 20) return { level: 'Very Low', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (pop < 40) return { level: 'Low', color: 'text-green-500', bgColor: 'bg-green-50' };
    if (pop < 60) return { level: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    if (pop < 80) return { level: 'High', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { level: 'Very High', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const rainLevel = getRainLevel(data.pop);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Rain Probability
        </h3>
        <p className="text-sm text-gray-600">
          {formatDate(date)} at ({lat.toFixed(4)}, {lon.toFixed(4)})
        </p>
      </div>

      <div className={`rounded-lg p-4 mb-4 ${rainLevel.bgColor}`}>
        <div className="text-center">
          <div className={`text-4xl font-bold ${rainLevel.color} mb-1`}>
            {data.pop.toFixed(1)}%
          </div>
          <div className={`text-sm font-medium ${rainLevel.color}`}>
            {rainLevel.level} Chance
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Confidence Interval</span>
          <span className="text-sm font-medium text-gray-800">
            {data.pop_low.toFixed(1)}% - {data.pop_high.toFixed(1)}%
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Mean Rainfall</span>
          <span className="text-sm font-medium text-gray-800">
            {data.mean_mm.toFixed(1)} mm/day
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Median Rainfall</span>
          <span className="text-sm font-medium text-gray-800">
            {data.median_mm.toFixed(1)} mm/day
          </span>
        </div>

        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-600">Data Years</span>
          <span className="text-sm font-medium text-gray-800">
            {data.n_years} years
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p className="font-medium mb-1">Data Source</p>
          <p>{data.source}</p>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center">
        <p>* Probability based on historical climatology data</p>
        <p>* Rainfall values are for rainy days only</p>
      </div>
    </div>
  );
};

export default ResultCard;
