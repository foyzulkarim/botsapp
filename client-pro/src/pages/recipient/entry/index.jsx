import React, { useState, useEffect } from 'react';
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
import { save } from '../service';

const EntryForm = (props) => {

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
          <Typography.Title level={2} type="warning">You can add only 5 recipient numbers in this hosted demo. You should add your known numbers only to test appropriately.</Typography.Title>
          <ProFormText
            width="md"
            label="Phone number"
            name="number"
            placeholder="Phone number with country code eg. 8801xxxxxxxxx"
          />
          <ProFormText
            width="md"
            label="Name"
            name="name"
            rules={[
              {
                required: true,
                message: 'Please enter the user name',
              },
            ]}
            placeholder="Please enter user name"
          />
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default EntryForm;
