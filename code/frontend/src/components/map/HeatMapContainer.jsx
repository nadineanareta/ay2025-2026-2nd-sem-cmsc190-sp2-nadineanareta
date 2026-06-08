import React, { useRef, useEffect, useState } from "react";
import HeatMapComponent from './HeatMapComponent';
import Cookies from 'js-cookie'

const HeatMapContainer = ({findUserLocation=false}) => {
	const [data, setData] = useState([]);
	const [selectedCrop, setSelectedCrop] = useState(null);
	const [selectedLabel, setSelectedLabel] = useState(null);
	const [startDate, setStartDate] = useState('2024-01-01');
	const [endDate, setEndDate] = useState('2024-11-11');

	useEffect(() => {
		const fetchData = async () => {
			try {
				var query = `http://localhost:3001/cropdex_image_data/all-annotation-data?start_date=${startDate}&end_date=${endDate}`;
				const response = await fetch(query);
				const jsonData = await response.json();
				setData(jsonData);
			} catch (error) {
				console.error('Error fetching data:', error);
			}
		};
		fetchData();
	}, [selectedCrop, selectedLabel, startDate, endDate])

	return (
    <HeatMapComponent dataPoints={data} findUserLocation={findUserLocation} />
  );
}

export default HeatMapContainer;