document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM (corregir IDs para que coincidan con HTML)
    const countryInput = document.getElementById('country-input');
    const searchBtn = document.getElementById('search-btn');
    const countryInfo = document.getElementById('country-info');
    const errorMessage = document.getElementById('error-message');
    
    // Elementos de información del país (corregir country-region)
    const countryName = document.getElementById('country-name');
    const countryFlag = document.getElementById('country-flag');
    const countryCapital = document.getElementById('country-capital');
    const countryRegion = document.getElementById('country-region'); // Asegurar que coincida con HTML
    const countryPopulation = document.getElementById('country-population');
    const countryTime = document.getElementById('country-time');
    const countryWeather = document.getElementById('country-weather');
    const weatherIcon = document.getElementById('weather-icon');
    const countryLanguages = document.getElementById('country-languages');
    const countryCurrency = document.getElementById('country-currency');
    
    // API Key de OpenWeatherMap
    const WEATHER_API_KEY = 'fab3fb25b8fbdf7635296e53f6e379dc';
    
    // Event listeners
    searchBtn.addEventListener('click', searchCountry);
    countryInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchCountry();
        }
    });
    
    async function searchCountry() {
        const country = countryInput.value.trim();
        if (!country) return;
        
        try {
            // Obtener datos del país
            const countryData = await fetchCountryData(country);
            displayCountryInfo(countryData);
            
            // Obtener información del tiempo (con manejo mejorado de errores)
            if (countryData.capital && countryData.capital[0]) {
                await fetchWeatherData(countryData.capital[0], countryData.cca2);
            } else {
                countryWeather.textContent = 'Capital no disponible';
                weatherIcon.src = '';
            }
            
            // Obtener hora actual (con formato más compatible)
            if (countryData.timezones && countryData.timezones[0]) {
                getCurrentTime(countryData.timezones[0]);
            } else {
                countryTime.textContent = 'Zona horaria no disponible';
            }
            
            // Mostrar información
            countryInfo.classList.remove('hidden');
            errorMessage.classList.add('hidden');
        } catch (error) {
            console.error('Error:', error);
            countryInfo.classList.add('hidden');
            errorMessage.textContent = 'Error al cargar datos. Intenta con otro país.';
            errorMessage.classList.remove('hidden');
        }
    }
    
    async function fetchCountryData(country) {
        try {
            const response = await fetch(`https://restcountries.com/v3.1/name/${country}`);
            if (!response.ok) throw new Error('País no encontrado');
            const data = await response.json();
            return data[0];
        } catch (error) {
            console.error('Error fetching country data:', error);
            throw error;
        }
    }
    
    function displayCountryInfo(country) {
        try {
            countryName.textContent = country.name.common;
            countryFlag.src = country.flags.png;
            countryFlag.alt = `Bandera de ${country.name.common}`;
            
            countryCapital.textContent = country.capital ? country.capital.join(', ') : 'No disponible';
            countryRegion.textContent = country.region || 'No disponible';
            if (country.subregion) {
                countryRegion.textContent += ` (${country.subregion})`;
            }
            
            countryPopulation.textContent = country.population 
                ? `${country.population.toLocaleString()} habitantes` 
                : 'No disponible';
            
            // Idiomas
            countryLanguages.textContent = country.languages 
                ? Object.values(country.languages).join(', ') 
                : 'No disponible';
            
            // Moneda
            if (country.currencies) {
                const [code, currency] = Object.entries(country.currencies)[0];
                countryCurrency.textContent = `${currency.name} (${currency.symbol || code})`;
            } else {
                countryCurrency.textContent = 'No disponible';
            }
            
            // Inicializar clima y hora
            countryWeather.textContent = 'Cargando datos del clima...';
            weatherIcon.src = '';
            countryTime.textContent = 'Cargando hora local...';
        } catch (error) {
            console.error('Error displaying country info:', error);
        }
    }
    
    async function fetchWeatherData(city, countryCode) {
        try {
            // 1. Primero obtener coordenadas
            const geoResponse = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${city},${countryCode}&limit=1&appid=${WEATHER_API_KEY}`
            );
            
            if (!geoResponse.ok) {
                throw new Error('Error al obtener ubicación');
            }
            
            const geoData = await geoResponse.json();
            if (!geoData || geoData.length === 0) {
                throw new Error('No se encontraron coordenadas');
            }
            
            const { lat, lon } = geoData[0];
            
            // 2. Luego obtener el clima con las coordenadas
            const weatherResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${WEATHER_API_KEY}`
            );
            
            if (!weatherResponse.ok) {
                throw new Error('Error al obtener clima');
            }
            
            const weatherData = await weatherResponse.json();
            
            // Mostrar datos del clima
            const temp = Math.round(weatherData.main.temp);
            const description = weatherData.weather[0].description;
            const humidity = weatherData.main.humidity;
            
            countryWeather.textContent = `${description}, ${temp}°C (Humedad: ${humidity}%)`;
            weatherIcon.src = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`;
            weatherIcon.alt = description;
            
        } catch (error) {
            console.error('Error fetching weather:', error);
            countryWeather.textContent = 'No se pudo cargar el clima';
            weatherIcon.src = '';
        }
    }
    
    function getCurrentTime(timezone) {
        try {
            const updateTime = () => {
                try {
                    const options = {
                        timeZone: timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    };
                    
                    const now = new Date();
                    const dateTimeStr = now.toLocaleDateString('es-ES', options);
                    const timeStr = now.toLocaleTimeString('es-ES', { 
                        timeZone: timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false 
                    });
                    
                    countryTime.textContent = `${dateTimeStr} - ${timeStr} (${timezone})`;
                } catch (e) {
                    console.error('Error formatting time:', e);
                    countryTime.textContent = `Hora local (${timezone}) no disponible`;
                }
            };
            
            updateTime();
            const intervalId = setInterval(updateTime, 60000); // Actualizar cada minuto
            
            // Limpiar intervalo si se cambia de país
            return () => clearInterval(intervalId);
            
        } catch (error) {
            console.error('Error getting time:', error);
            countryTime.textContent = 'Hora no disponible';
        }
    }
    
    // Ejemplo al cargar (usar un país que funcione bien como prueba)
    countryInput.value = 'España';
    searchBtn.click();
});