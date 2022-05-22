import React, { useState, useEffect } from 'react';
import { Form, Card, message } from 'antd';
import ProForm, {
  ProFormDatePicker,
  ProFormDigit,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
  ProFormCheckbox,
  ProFormSelect,
} from '@ant-design/pro-form';
import { useRequest } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import { save, searchPhone } from '../service';

const EntryForm = (props) => {

  const [number, setNumber] = useState(null);

  const fetchPhone = async () => {
    const result = await searchPhone({});
    console.log('phones', result);
    if (result.data && result.data.length > 0) {
      setNumber(result.data[0].number);
      form.setFieldsValue({
        number: result.data[0].number
      });
    }
  }

  useEffect(() => {
    fetchPhone();
  }, []);

  const [form] = Form.useForm();

  const onFinish = async (values) => {
    console.log(values, form);
    const result = await save(values);
    console.log('resource', result);
    if (result instanceof Error) {
      message.error(result.message);
    }
    else {
      message.success(result.message);
      form.resetFields();
    }
  };

  return (
    <PageContainer content="My amazing entry form">
      <Card bordered={false}>
        <ProForm
          hideRequiredMark
          style={{
            margin: 'auto',
            marginTop: 8,
            maxWidth: 600,
          }}
          name="basic"
          layout="vertical"
          onFinish={(v) => onFinish(v)}
          form={form}
        >
          <ProFormText
            width="md"
            label="Phone number"
            name="number"
            value={number}
            disabled
          />
          <ProFormText
            width="md"
            label="Request"
            name="requestText"
            rules={[
              {
                required: true,
                message: 'Please enter the user request text',
              },
            ]}
            placeholder="Please enter user request text"
          />

          <ProFormText
            width="md"
            label="Response"
            name="responseText"
            rules={[
              {
                required: true,
                message: 'Please enter the bot response',
              },
            ]}
            placeholder="Please enter bot response"
          />
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default EntryForm;
