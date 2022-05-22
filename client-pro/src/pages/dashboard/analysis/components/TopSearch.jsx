import { InfoCircleOutlined } from '@ant-design/icons';
import { Card, Col, Row, Table, Tooltip } from 'antd';
import { TinyArea } from '@ant-design/charts';
import React from 'react';
import numeral from 'numeral';
import NumberInfo from './NumberInfo';
import Trend from './Trend';
import styles from '../style.less';

const columns = [
  {
    title: 'Sender',
    dataIndex: 'from',
  },
  {
    title: 'Receiver',
    dataIndex: 'to',
  },
  {
    title: 'Text',
    dataIndex: 'body',
  },
];

const TopSearch = ({ loading, visitData2, searchData, messageInfo }) => (
  <Card
    loading={loading}
    bordered={false}
    title="Message summary"
    style={{
      height: '100%',
    }}
  >
    <Row gutter={68}>
      <Col
        sm={12}
        xs={24}
        style={{
          marginBottom: 24,
        }}
      >
        <NumberInfo
          subTitle={
            <span>
              Bot messages sent
            </span>
          }
          gap={8}
          total={numeral(messageInfo.totalBotMessage).format('0,0')}
        />
        <TinyArea xField="x" height={45} forceFit yField="y" smooth data={visitData2} />
      </Col>
      <Col
        sm={12}
        xs={24}
        style={{
          marginBottom: 24,
        }}
      >
        <NumberInfo
          subTitle={
            <span>
              Total chat message sent
            </span>
          }
          total={numeral(messageInfo.totalMessageSent).format('0,0')}
          gap={8}
        />
        <TinyArea xField="x" height={45} forceFit yField="y" smooth data={visitData2} />
      </Col>
    </Row>
    <Table
      rowKey={(record) => record.index}
      size="small"
      columns={columns}
      dataSource={messageInfo.recentMessages}
      rowSelection={false}
      pagination={false}
    />
  </Card>
);

export default TopSearch;
