import React, { useRef, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useParams } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import {arrayChunk} from '../utilities/ArrayChunkers'

const AssociationInfoPage = () => {

	const { associd } = useParams();

	const [assocData, setAssocData] = useState(null);
	const [assocInfo, setAssocInfo] = useState(null);
	const [assocLabels, setAssocLabels] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			try {

				const cookie = Cookies.get('cdexuser');
				const data_query = `https://www.api.spidhive.net/associations/association-crop-image-count?association_id=${associd}`
				const response = await fetch(data_query, { method: 'GET', headers: { 'Authorization': `Bearer ${cookie}`, 'Content-Type': 'application/json'}});
				const jsonData = await response.json();
				setAssocData(jsonData.data);
				setAssocInfo(jsonData.association_data);

				const data_query_2 = `https://www.api.spidhive.net/associations/association-image-annotation-uniques?association_id=${associd}`
				const response_2 = await fetch(data_query_2, { method: 'GET', headers: { 'Authorization': `Bearer ${cookie}`, 'Content-Type': 'application/json'}});
				const jsonData_2 = await response_2.json();
				console.log(jsonData_2)


			} catch (error) { 
				console.error('Error fetching data:', error);
			}
		};
		fetchData();
	}, []);

	if (assocData === null) {
		return (<div className="image-list-div"><Spinner animation="border" /></div>)
	} else {
		return(
			<Container className="m-2">
				<Row key={0}>
					<Col>
						<h1>{assocInfo.association} Contributions</h1>
					</Col>
				</Row>
			{ 
				arrayChunk(assocData, 5).map((row, i) => (
					<Row key={i+4}>
						{row.map((col, j) => (
							<Col key={j} xs={3} md={2} className="mb-2" style={{alignItems:'center'}}>
								<Button
									disabled={true}
									variant="outline-primary"
									style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2px' }} 
									className="custom-fill-cell" >
										<span><b>{col["cropdex_crop.crop_name"]}</b></span>
										<span>{col.count} Photos</span>
								</Button>
							</Col>
						))}
					</Row>
				))
			}
			</Container>
		)
	}
}

export default AssociationInfoPage;