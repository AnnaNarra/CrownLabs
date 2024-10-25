import { useState, useEffect, FC, useContext } from 'react';
import { Modal, Form, Input, Tooltip, Typography, Space } from 'antd';
import Button from 'antd-button-color';
const { Text } = Typography;
import {
  CreateInstanceSnapshotMutation,
  useInstanceSnapshotListQuery,
} from '../../generated-types';
import { ErrorContext } from '../../errorHandling/ErrorContext';
import { FetchResult } from '@apollo/client';

type Snapshot = {
  name?: string;
  namespace?: string;
  imageName?: string;
  instanceName?: string;
  instanceNamespace?: string;
  description?: string;
};

type Valid = {
  name: { status: string; help?: string };
};

export interface IModalCreateSnapshotProps {
  tenantNamespace: string;
  instanceName: string;
  show: boolean;
  setShow: (status: boolean) => void;
  submitHandler: (
    s: Snapshot
  ) => Promise<
    FetchResult<
      CreateInstanceSnapshotMutation,
      Record<string, any>,
      Record<string, any>
    >
  >;
  loading: boolean;
}

const ModalCreateSnapshot: FC<IModalCreateSnapshotProps> = ({ ...props }) => {
  const {
    tenantNamespace,
    instanceName,
    show,
    setShow,
    submitHandler,
    loading,
  } = props;
  
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const [formSnapshot, setFormSnapshot] = useState<Snapshot>({
    name:  undefined, 
    namespace: tenantNamespace,
    imageName: undefined, 
    instanceName: instanceName.slice(instanceName.indexOf("/")+1),
    instanceNamespace: tenantNamespace,
    description: undefined, 
  });

  const closehandler = () => {
    setShow(false); 
    setShowDisclaimer(false);
  };

  const [valid, setValid] = useState<Valid>({
    name: { status: 'success', help: undefined },
  });

  const nameValidator = () => {
    if (formSnapshot.name === '' || formSnapshot.name === undefined) {
      setValid(old => {
        return {
          ...old,
          name: { status: 'error', help: 'Please insert image name' },
        };
      });
    } else if (
      !errorFetchSnapshots &&
      !loadingFetchSnapshots &&
      dataFetchSnapshots?.instanceSnapshots?.snapshots
        ?.map(s => s?.metadata?.name)
        .includes(formSnapshot.name.trim())
    ) {
      setValid(old => {
        return {
          ...old,
          name: {
            status: 'error',
            help: 'This name has already been used in this workspace',
          },
        };
      });
    } else if (
      //Check if the inserted name doesn't start and end with a letter and doesn't contain only lowercase letters, numbers or -(dashes)
      !(/^[a-z][\da-z\-]*[a-z]$/.test(formSnapshot.name)) 
    ) {
      setValid(old => {
        return {
          ...old,
          name: {
            status: 'error',
            help: 'The name must start and end with a letter and can contain only lowercase letters, numbers or "-"',
          },
        };
      });
    } else {
      setValid(old => {
        return {
          ...old,
          name: { status: 'success', help: undefined },
        };
      });
    }
  };

  useEffect(() => {
    if (
      formSnapshot.name &&
      formSnapshot.description &&
      valid.name.status === 'success'
    )
      setButtonDisabled(false);
    else setButtonDisabled(true);
  }, [formSnapshot, valid.name.status]);

  const { apolloErrorCatcher } = useContext(ErrorContext);
  const {
    data: dataFetchSnapshots,
    error: errorFetchSnapshots,
    loading: loadingFetchSnapshots,
    refetch: refetchSnapshots,
  } = useInstanceSnapshotListQuery({
    onError: apolloErrorCatcher,
    variables: { tenantNamespace },
  });
  
  const fullLayout = {
    wrapperCol: { offset: 0, span: 24 },
  };

  return (
    <>
      <Modal
        destroyOnClose={true}
        title="Save a new image"
        centered
        open={show}
        footer={null}
        confirmLoading={loading}
        onCancel={closehandler}
      >
        {showDisclaimer ? 
          <Space align="center" direction="vertical" size="middle" style={{ display: 'flex' }}>
            <Text type="warning">The saving process can take up to 10-15 minutes. You will be notified upon completion, right next to the instance you created it from.</Text>
          </Space>
          :<Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            <Text italic type="secondary">Create a snapshot image of the VM to use it as the base image for a new template. Make sure of deleting any unneccessary file to save the cleanest possible image.</Text>
            <Form
              labelCol={{ span: 3 }}
              wrapperCol={{ span: 21 }}
              onSubmitCapture={() => {
                submitHandler({
                  ...formSnapshot,
                })
                  .then(() => {
                    setShowDisclaimer(true);//setShow(false);
                    setFormSnapshot(old => {
                      return { ...old, name: undefined, description: undefined };
                    });
                  })
                  .catch(apolloErrorCatcher);
              }}
            >
              <Form.Item
                {...fullLayout}
                name="snapshotname"
                label="Name:"
                className="mt-1"
                required
                validateStatus={valid.name.status as 'success' | 'error'} 
                help={valid.name.help}
                validateTrigger="onChange"
                rules={[
                  {
                    required: true,
                    validator: nameValidator,
                  },
                ]}
              >
                <Input
                  onFocus={() => refetchSnapshots({ tenantNamespace })} 
                  onChange={e =>
                    setFormSnapshot(old => {
                      return { ...old, name: e.target.value.toLowerCase(), imageName: e.target.value };
                    })
                  }
                  placeholder="Insert the name of the new image"
                  allowClear
                />
              </Form.Item>
              <Form.Item
                {...fullLayout}
                name="image description"
                className="mt-1"
                required
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input.TextArea 
                  placeholder="Insert a description for the image" 
                  allowClear 
                  onChange={e =>
                    setFormSnapshot(old => {
                      return { ...old, description: e.target.value };
                    })
                  } 
                />
              </Form.Item>
              <Form.Item {...fullLayout}>
              <div className="flex justify-center">
                {buttonDisabled ? (
                  <Tooltip
                    title={'Impossible to save the image, please fill out all the fields'}
                  >
                    <span className="cursor-not-allowed">
                      <Button
                        className="w-24 pointer-events-none"
                        disabled
                        htmlType="submit"
                        type="primary"
                        shape="round"
                        size="middle"
                      >
                        {'Save'}
                      </Button>
                    </span>
                  </Tooltip>
                ) : (
                  <Button
                    className="w-24"
                    htmlType="submit"
                    type="primary"
                    shape="round"
                    size="middle"
                    loading={loading}
                  >
                    {!loading && 'Save'}
                  </Button>
                )}
              </div>
            </Form.Item>
            </Form>
          </Space>
          }
      </Modal>
    </>
  );
};

export type { Snapshot };
export default ModalCreateSnapshot;