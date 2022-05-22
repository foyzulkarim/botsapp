import React, { useEffect, useState } from 'react';
import { Form, Card, message, Typography } from 'antd';
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
import { save, searchPhone, searchRecipients } from '../service';
const { Title } = Typography;

const EntryForm = (props) => {

  const [form] = Form.useForm();
  const [phone, setPhone] = useState('');
  const [recipient, setRecipient] = useState(null);

  const fetchPhone = async () => {
    const result = await searchPhone({});
    console.log('phones', result);
    if (result.data && result.data.length > 0) {
      setPhone(result.data[0]);
      form.setFieldsValue({
        from: result.data[0].number
      });
    }
  }

  const fetchRecipients = async () => {
    const result = await searchRecipients();
    const options = result.data.map(r => ({ label: r.name, value: r._id, data: r }));
    return options;
  };

  useEffect(() => {
    fetchPhone();
  }, []);

  const onFinish = async (values) => {
    console.log(values, form);
    const result = await save({ from: values.from, to: values.to, body: values.body });
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
          <Title level={2} type="warning">You can send 50 message in 24 hours in this hosted demo.</Title>
          <ProFormText
            width="md"
            label="Sender"
            name="from"
            disabled
            rules={[
              {
                required: true,
                message: 'Please enter sender',
              },
            ]}
            placeholder="Please enter sender"
          />
          <ProFormSelect
            width="md"
            name="recipientId"
            label="Recipient"
            request={fetchRecipients}
            placeholder="Please select a recipient"
            rules={[{ required: true, message: 'Please select recipient' }]}
            onChange={(value, e) => {
              setRecipient({ ...e.data });
              form.setFieldsValue({
                to: e.data.number
              });
            }}
          />

          <ProFormText
            width="md"
            label="Receiver"
            name="to"
            rules={[
              {
                required: true,
                message: 'Please enter the receiver',
              },
            ]}
            placeholder="Please enter receiver"
            disabled
          />

          <ProFormText
            width="md"
            label="Text"
            name="body"
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
