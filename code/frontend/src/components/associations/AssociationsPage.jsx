import React, { useRef, useEffect, useState } from "react";
import { useNavigate  } from 'react-router-dom';
import Cookies from 'js-cookie';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import {arrayChunk} from '../utilities/ArrayChunkers'

const AssociationsPage = () => {

	let navigate = useNavigate();
	function changeLocation(placeToGo){
		navigate(placeToGo);
		navigate(0)
	}

	const [data, setData] = useState(null);

	function handleButtonClick (buttonData) {
		changeLocation(`/association-info/${buttonData.id}`)
	}

	useEffect(() => {
		const fetchData = async () => {
			try {
				const cookie = Cookies.get('cdexuser');
				const data_query = 'https://www.api.spidhive.net/associations/all-associations'
				const response = await fetch(data_query, { method: 'GET', headers: { 'Authorization': `Bearer ${cookie}`, 'Content-Type': 'application/json'}});
				const jsonData = await response.json();
				setData(jsonData);
			} catch (error) { 
				console.error('Error fetching data:', error);
			}
		};
		fetchData();
	}, []);

	if (data == null) {
		return (
			<div className="image-list-div">
				<Spinner animation="border" />
			</div>
		)
	} else {
		return (
			<Container className="m-3">
			{ arrayChunk(data, 3).map((row, i) => (
					<Row key={i}>
						{row.map((col, j) => (
							<Col key={j+i} xs={6} md={4} className="mb-3" style={{alignItems:'center'}}>
								<Button
									variant="outline-success"
									style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px' }} 
									className="custom-fill-cell" 
									onClick={() => {handleButtonClick(col)}}>
										<h5>{ col.division }</h5>
										<h6>{col.total_images} Photos</h6>
								</Button>
							</Col>
						))}
					</Row>
				))
			}
			</Container>
		);
	}
}

export default AssociationsPage;