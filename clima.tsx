import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Wind, Droplets, Sun, Moon, MapPin, AlertTriangle, RefreshCw, Loader, TrendingUp, Calendar } from 'lucide-react';

// --- SUB-COMPONENTE: GRÁFICO SVG (Leve) ---
const MiniChart = ({ data, dataKey, color, type = 'area', unit = '', height = 100 }) => {
  if (!data || data.length === 0) return null;
  const width = 100; 
  const values = data.map(d => d[dataKey]);
  const maxVal = Math.max(...values, 10);
  const minVal = type === 'temp' ? Math.min(...values) - 5 : 0;
  const range = maxVal - minVal;
  
  const getY = (val) => height - ((val - minVal) / range) * height;
  const getX = (idx) => (idx / (data.length - 1)) * width;

  const points = data.map((d, i) => `${getX(i)},${getY(d[dataKey])}`).join(' ');
  const areaPoints = `${points} 100,${height} 0,${height}`;

  return (
    <div className="w-full h-32 mt-2 mb-4 relative select-none">
      <svg viewBox={`0 0 100 ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(p => <line key={p} x1="0" y1={height * p} x2="100" y2={height * p} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />)}
        
        {type === 'bar' ? (
          data.map((d, i) => (
            <rect key={i} x={getX(i) - 1} y={getY(d[dataKey])} width="2" height={height - getY(d[dataKey])} fill={color} opacity="0.8" rx="0.5" />
          ))
        ) : (
          <>
            <polygon points={areaPoints} fill={`url(#grad-${dataKey})`} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {data.map((d, i) => <circle key={i} cx={getX(i)} cy={getY(d[dataKey])} r="1.5" fill="white" stroke={color} strokeWidth="1" />)}
          </>
        )}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
        {data.map((d, i) => (
          <div key={i} style={{ opacity: i % 3 === 0 || i === data.length - 1 ? 1 : 0 }}>{d.time}</div>
        ))}
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
const WeatherComplete = () => {
  const [activeLocation, setActiveLocation] = useState('itajai');
  const [activeTab, setActiveTab] = useState('temp');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  const LOCATIONS = {
    itajai: { name: "Prefeitura de Itajaí", sub: "Centro / Vila Operária", lat: -26.9046, lon: -48.6612 },
    bc: { name: "Rua Bibiano Santos", sub: "Pioneiros - BC", lat: -26.9745, lon: -48.6360 }
  };

  const getConditionIcon = (code, isNight) => {
    if (code === 0) return isNight ? <Moon className="w-5 h-5 text-indigo-300" /> : <Sun className="w-5 h-5 text-yellow-500" />;
    if (code <= 3) return <Cloud className="w-5 h-5 text-yellow-300 fill-gray-100" />;
    if (code >= 51) return <CloudRain className="w-5 h-5 text-blue-500" />;
    return <Cloud className="w-5 h-5 text-gray-400" />;
  };

  const fetchWeatherData = async () => {
    setLoading(true);
    const now = new Date();
    const currentHour = now.getHours();
    
    try {
      const requests = Object.keys(LOCATIONS).map(async (key) => {
        const loc = LOCATIONS[key];
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,weather_code&current_weather=true&timezone=America%2FSao_Paulo&forecast_days=1`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const hourlyData = data.hourly.time.map((timeIso, index) => {
          const d = new Date(timeIso);
          const h = d.getHours();
          return {
            hourInt: h,
            time: `${h}h`,
            temp: Math.round(data.hourly.temperature_2m[index]),
            humidity: data.hourly.relative_humidity_2m[index],
            rain: data.hourly.precipitation_probability[index],
            wind: Math.round(data.hourly.wind_speed_10m[index]),
            code: data.hourly.weather_code[index],
            isNight: h >= 18 || h < 6
          };
        }).filter(item => item.hourInt >= currentHour);

        const maxWind = Math.max(...hourlyData.map(h => h.wind));
        const maxRain = Math.max(...hourlyData.map(h => h.rain));
        const alerts = [];
        if (maxWind >= 25) alerts.push({ type: 'wind', msg: `Vento Forte: ${maxWind}km/h` });
        if (maxRain >= 50) alerts.push({ type: 'rain', msg: `Chuva: ${maxRain}%` });
        if (currentHour >= 10 && currentHour <= 15) alerts.push({ type: 'uv', msg: 'Índice UV Alto' });

        return {
          key, ...loc,
          current: {
            temp: Math.round(data.current_weather.temperature),
            wind: Math.round(data.current_weather.windspeed),
            rainChance: hourlyData[0]?.rain || 0,
            humidity: hourlyData[0]?.humidity || 0,
            conditionCode: data.current_weather.weathercode,
            isNight: currentHour >= 18 || currentHour < 6
          },
          hourly: hourlyData,
          alerts
        };
      });

      const results = await Promise.all(requests);
      const newData = {};
      results.forEach(res => newData[res.key] = res);
      setWeatherData(newData);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchWeatherData(); }, []);

  if (loading || !weatherData) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400"><Loader className="animate-spin" /></div>;

  const current = weatherData[activeLocation];
  const themeColors = {
    temp: { text: 'text-orange-600', bg: 'bg-orange-50', hex: '#ea580c' },
    rain: { text: 'text-blue-600', bg: 'bg-blue-50', hex: '#2563eb' },
    wind: { text: 'text-teal-600', bg: 'bg-teal-50', hex: '#0d9488' },
  };

  // Funções de destaque para a lista
  const getWindStyle = (w) => w >= 25 ? "text-orange-600 font-bold bg-orange-100 px-1 rounded" : w >= 20 ? "text-blue-600 font-medium" : "text-slate-500";
  const getRainStyle = (r) => r >= 50 ? "text-white bg-blue-500 px-2 rounded-full font-bold" : r > 0 ? "text-blue-500 font-medium" : "text-slate-400";

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen font-sans text-slate-800 flex flex-col relative">
      
      {/* 1. HEADER & CONTROLS */}
      <div className="bg-white p-4 shadow-sm z-20 sticky top-0">
        <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
          {Object.keys(LOCATIONS).map(key => (
            <button key={key} onClick={() => setActiveLocation(key)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeLocation === key ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>
              {key === 'itajai' ? 'Itajaí' : 'BC (Pioneiros)'}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-end mb-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{current.name}</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin size={10}/> {current.sub}</p>
          </div>
          <div className="text-right">
             <div className="text-4xl font-bold text-slate-800">{current.current.temp}°</div>
             <div className="flex justify-end mt-1">{getConditionIcon(current.current.conditionCode, current.current.isNight)}</div>
          </div>
        </div>

        {/* Alertas */}
        {current.alerts.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mt-2">
            {current.alerts.map((a, i) => (
              <div key={i} className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border border-orange-200">
                <AlertTriangle size={10}/> {a.msg}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* 2. MAIN STATS GRID */}
        <div className="grid grid-cols-3 gap-2 p-4 pt-2">
          <div className="bg-white p-3 rounded-xl shadow-sm flex flex-col items-center justify-center border border-slate-100">
            <Wind size={18} className="text-teal-500 mb-1" />
            <span className="text-base font-bold text-slate-700">{current.current.wind}<span className="text-xs font-normal text-slate-400">km</span></span>
            <span className="text-[10px] text-slate-400 uppercase">Vento</span>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm flex flex-col items-center justify-center border border-slate-100">
            <Droplets size={18} className="text-blue-400 mb-1" />
            <span className="text-base font-bold text-slate-700">{current.current.humidity}<span className="text-xs font-normal text-slate-400">%</span></span>
            <span className="text-[10px] text-slate-400 uppercase">Umid.</span>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm flex flex-col items-center justify-center border border-slate-100">
            <CloudRain size={18} className="text-indigo-500 mb-1" />
            <span className="text-base font-bold text-slate-700">{current.current.rainChance}<span className="text-xs font-normal text-slate-400">%</span></span>
            <span className="text-[10px] text-slate-400 uppercase">Chuva</span>
          </div>
        </div>

        {/* 3. CHART SECTION */}
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex justify-between items-center mb-2">
             <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><TrendingUp size={12}/> Tendência (12h)</h3>
             <div className="flex gap-1 bg-slate-50 p-1 rounded-lg">
               {['temp', 'rain', 'wind'].map(t => (
                 <button key={t} onClick={() => setActiveTab(t)} 
                   className={`p-1.5 rounded transition-all ${activeTab === t ? 'bg-white shadow text-slate-800' : 'text-slate-300'}`}>
                   {t === 'temp' && <Sun size={14}/>}
                   {t === 'rain' && <CloudRain size={14}/>}
                   {t === 'wind' && <Wind size={14}/>}
                 </button>
               ))}
             </div>
          </div>
          <MiniChart 
            data={current.hourly.slice(0, 12)} 
            dataKey={activeTab} 
            color={themeColors[activeTab].hex} 
            unit={activeTab === 'temp' ? '°' : activeTab === 'rain' ? '%' : ''} 
            type={activeTab === 'rain' ? 'bar' : 'area'} 
          />
        </div>

        {/* 4. DETAILED HOURLY LIST */}
        <div className="bg-white rounded-t-3xl shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)] p-4 min-h-[300px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-1"><Calendar size={12}/> Detalhes Hora a Hora</h3>
          
          <div className="grid grid-cols-5 text-[10px] font-bold text-slate-400 text-center pb-2 border-b border-slate-100">
            <span className="text-left pl-2">HORA</span>
            <span>TEMP</span>
            <span>CHUVA</span>
            <span>VENTO</span>
            <span>UMID</span>
          </div>

          <div className="space-y-1 mt-2">
            {current.hourly.map((h, i) => (
              <div key={i} className="grid grid-cols-5 items-center py-2.5 border-b border-slate-50 hover:bg-slate-50 text-xs transition-colors">
                <div className="flex flex-col items-start pl-2">
                  <span className="font-bold text-slate-700">{h.time}</span>
                  <div className="mt-0.5 opacity-70">{getConditionIcon(h.code, h.isNight)}</div>
                </div>
                <div className="text-center font-bold text-slate-600 text-sm">{h.temp}°</div>
                <div className={`text-center flex justify-center items-center ${getRainStyle(h.rain)}`}>
                  {h.rain > 0 ? `${h.rain}%` : '-'}
                </div>
                <div className={`text-center ${getWindStyle(h.wind)}`}>
                   {h.wind} <span className="text-[9px] font-normal opacity-70">km</span>
                </div>
                <div className="text-center text-slate-400 font-medium">
                   {h.humidity}%
                </div>
              </div>
            ))}
          </div>
          <div className="text-center text-[10px] text-slate-300 mt-6 pb-4">
            Dados: Open-Meteo API • {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherComplete;
