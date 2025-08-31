import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Card from './Card';
import './ReportPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ReportPage = ({ stats, chartData, tableData, chartTitle }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 104, 55, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 12
          }
        }
      }
    }
  };

  return (
    <div className="report-page-grid">
      <div className="report-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card-light">
            <div className="label">{stat.label}</div>
            <div className="value">{stat.value}</div>
            <div className="subtext">{stat.subtext}</div>
          </div>
        ))}
      </div>

      <Card title={chartTitle}>
        <div className="chart-container">
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <Bar options={chartOptions} data={chartData} />
          </div>
        </div>
      </Card>

      <Card title="Detailed Breakdown">
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                {tableData.headers.map(header => <th key={header}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ReportPage;
