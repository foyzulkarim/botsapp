import React, { useState, useRef, useEffect } from 'react';
import { Card, message } from 'antd';
import {
    ProFormText,
} from '@ant-design/pro-form';
import { useRequest, useModel, history, useAccess } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import { submitForm, preValidateActivation, getById } from '../service';
import QRCode from 'qrcode';

const BasicForm = (props) => {
    const { auth } = useModel('getAuthState');
    const [phone, setPhone] = useState(null);

    const fetchPhone = async () => {
        const { id } = props.match.params;
        const result = await preValidateActivation(id);
        console.log('phones', result);
        if (result instanceof Error) {
            message.error(result.message);
            history.push(`/phones`);
        }
        else {
            message.success(result.message);
            setPhone(result.phone.number);
        }
    }

    useEffect(() => {
        fetchPhone();
    }, []);

    const [wa, setWa] = useState('');
    const c1 = useRef(null);
    const [loading, setLoading] = useState(false);

    const getCode = async () => {
        var obj = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}`,
            }
        }
        let res = await fetch(`${API_URL}/api/phones/activate?number=${phone}`, obj);
        let reader = res.body.getReader();
        let result;
        let decoder = new TextDecoder('utf8');
        const canvas = c1.current;
        const ctx = canvas.getContext('2d');
        setLoading(true);
        while (!result?.done) {
            result = await reader.read();
            let chunk = decoder.decode(result.value);
            console.log(chunk);
            QRCode.toCanvas(canvas, chunk, function (error) {
                if (error) console.error(error)
                console.log('success!');
            })
        }
        console.log(result);
        if (result.done) {
            console.log('done');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setLoading(false);
            message.success("Phone is connected");
            history.push(`/phones`);
        }
    };

    return (
        <PageContainer content="My amazing product entry form">
            <Card>
                <ProFormText
                    width="md"
                    label="Phone number"
                    name="phoneNumber"
                    value={phone}
                    disabled
                />
                {!loading && <button onClick={getCode}>Get code</button>}
                <canvas id="c1" ref={c1} width="400" height="400"></canvas>
            </Card>
        </PageContainer>
    );
};

export default BasicForm;
