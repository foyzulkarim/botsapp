import React, { useEffect, useState } from 'react';
import { Form, Card, message } from 'antd';
import ProForm, {
  ProFormDatePicker,
  ProFormDigit,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
  ProFormCheckbox,
} from '@ant-design/pro-form';
import { useRequest } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import { save, searchPhone } from '../service';

const EntryForm = (props) => {

  const [form] = Form.useForm();
  const [phone, setPhone] = useState('');

  const fetchPhone = async () => {
    const result = await searchPhone({});
    console.log('phones', result);
    if (result.data && result.data.length > 0) {
      setPhone(result.data[0]);
      form.setFieldsValue({
        sender: result.data[0].number
      });
    }
  }

  useEffect(() => {
    fetchPhone();
  }, []);

  const onFinish = async (values) => {
    console.log(values, form);
    const result = await save(values);
    console.log(result);

    if (result instanceof Error) {
      message.error(result.message);
    }
    else {
      message.success(result.message);
      form.resetFields(['receiver', 'text']);
    }
  };

  return (
    <PageContainer content="My amazing message entry form">
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
            label="Sender"
            name="sender"
            disabled
            rules={[
              {
                required: true,
                message: 'Please enter sender',
              },
            ]}
            placeholder="Please enter sender"
          />

          <ProFormText
            width="md"
            label="Receiver"
            name="receiver"
            rules={[
              {
                required: true,
                message: 'Please enter the receiver',
              },
            ]}
            placeholder="Please enter receiver"
          />

          <ProFormText
            width="md"
            label="Text"
            name="text"
            rules={[
              {
                required: true,
                message: 'Please enter the text',
              },
            ]}
            placeholder="Please enter text"
          />
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default EntryForm;
