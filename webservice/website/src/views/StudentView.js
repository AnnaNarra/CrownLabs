import {Col, Row} from "react-bootstrap";
import LabTemplatesList from "../components/LabTemplatesList";
import LabInstancesList from "../components/LabInstancesList";
import React from "react";
import StatusArea from "../components/StatusArea";
import "./admin.css"

export default function StudentView(props) {
    return <div style={{minHeight: '100vh'}}>
        <Row>
            <Col>
                <LabTemplatesList labs={props.templateLabs} func={props.funcTemplate}
                                  start={props.start}/>
            </Col>
            <Col>
                <LabInstancesList runningLabs={props.instanceLabs}
                                  func={props.funcInstance} connect={props.connect}
                                  stop={props.stop}
                                  showStatus={props.showStatus}/>
            </Col>
        </Row>
        <Row>
            <Col className="col-2"/>
            <Col className="col-8">
                <StatusArea hidden={props.hidden} events={props.events}/>
            </Col>
            <Col className="col-2"/>
        </Row>
    </div>;
}