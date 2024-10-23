import { FC, useContext, useState } from 'react';
import { Tooltip } from 'antd';
import Button from 'antd-button-color';
import {
  ExclamationCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { Instance, WorkspaceRole } from '../../../../utils';
import { Phase, useApplyInstanceMutation, useCreateInstanceSnapshotMutation } from '../../../../generated-types';
import { setInstanceRunning } from '../../../../utilsLogic';
import { ErrorContext } from '../../../../errorHandling/ErrorContext';
import { ApolloError } from '@apollo/client';
import ModalCreateSnapshot from '../../../templatePage';
import { Snapshot } from '../../../templatePage/ModalCreateSnapshot';

export interface IRowInstanceActionsPersistentProps {
  extended: boolean;
  instance: Instance;
  viewMode: WorkspaceRole;
}

const RowInstanceActionsPersistent: FC<IRowInstanceActionsPersistentProps> = ({
  ...props
}) => {
  const { extended, instance, viewMode } = props;

  const { status } = instance;

  const font22px = { fontSize: '22px' };

  const [disabled, setDisabled] = useState(false);
  const [show, setShow] = useState(false);

  const { apolloErrorCatcher } = useContext(ErrorContext);
  const [applyInstanceMutation] = useApplyInstanceMutation({
    onError: apolloErrorCatcher,
  });
  const [CreateInstanceSnapshotMutation, { loading }] = useCreateInstanceSnapshotMutation({
    onError: apolloErrorCatcher,
  });

  const mutateInstanceStatus = async (running: boolean) => {
    if (!disabled) {
      setDisabled(true);
      try {
        const result = await setInstanceRunning(
          running,
          instance,
          applyInstanceMutation
        );
        if (result) setTimeout(setDisabled, 400, false);
      } catch (err) {
        apolloErrorCatcher(err as ApolloError);
      }
    }
  };

  const classFromProps = () => {
    if (status === Phase.Off) {
      if (extended) return 'primary';
      else return 'success';
    }
    return 'primary';
  };

  const classFromPropsMobile = () => {
    if (status === Phase.Off) {
      if (extended) return 'link';
      else return 'success';
    }
    return 'link';
  };

  const submitHandler = (s: Snapshot) => 
    CreateInstanceSnapshotMutation({
      variables: {
        snapshotName: s.name!,
        snapshotNamespace: instance.tenantNamespace,
        imageName: `${instance.workspaceName}-` + s.imageName,
        instanceName: instance.name,
        instanceNamespace: instance.tenantNamespace,
        annotations: { 
          "meta.instancesnapshot.crownlabs.polito.it/description": s.description!
        },
      },
    });

  return <>
    <ModalCreateSnapshot
      tenantNamespace={instance.tenantNamespace}
      instanceName={instance.id}
      show={show}
      setShow={setShow}
      submitHandler={submitHandler}
      loading={loading}
    />
    {status === Phase.Ready || status === Phase.ResourceQuotaExceeded ? (
      <Tooltip placement="top" title="Pause">
        <Button
          loading={disabled}
          className={`hidden ${
            extended ? 'sm:block' : 'xs:block'
          } flex items-center`}
          type="warning"
          with="link"
          shape="circle"
          size="middle"
          disabled={disabled}
          icon={
            <PauseCircleOutlined
              className="flex justify-center items-center"
              style={font22px}
            />
          }
          onClick={() => mutateInstanceStatus(false)}
        />
      </Tooltip>
    ) : status === Phase.Off ? (
      <Tooltip placement="top" title="Start">
        <Button
          loading={disabled}
          className={`hidden ${extended ? 'sm:block' : 'xs:block'} py-0`}
          type="success"
          with="link"
          shape="circle"
          size="middle"
          disabled={disabled}
          icon={
            <PlayCircleOutlined
              className="flex justify-center items-center"
              style={font22px}
            />
          }
          onClick={() => mutateInstanceStatus(true)}
        />
      </Tooltip>
    ) : (
      <Tooltip placement="top" title={'Current instance Status: ' + status}>
        <div className="cursor-not-allowed">
          <Button
            className={`hidden pointer-events-none ${
              extended ? 'sm:block' : 'xs:block'
            } py-0`}
            type="primary"
            with="link"
            shape="circle"
            size="middle"
            disabled={true}
            icon={
              <ExclamationCircleOutlined
                className="flex justify-center items-center"
                style={font22px}
              />
            }
          />
        </div>
      </Tooltip>
    )
    }
    <Tooltip placement="top" title={"Save a new image"}>
      <div
        className={`hidden ${
          extended ? 
            viewMode === WorkspaceRole.manager ? 'xl:block' : 'lg:block'
            : 'sm:block '
        } ${status === Phase.Off ? '' : 'cursor-not-allowed'}`}
      >
        <Button
          className={`${status === Phase.Off ? '' : 'pointer-events-none'}`}
          type={classFromProps()}
          shape="round"
          size="middle"
          onClick={() => {
            setShow(true);
          }}
          disabled={status !== Phase.Off}
        >
          Save
        </Button>
      </div>
      <div
        className={`hidden ${
          extended
            ? `sm:block ${
                viewMode === WorkspaceRole.manager ? 'xl:hidden' : 'lg:hidden'
              }`
            : 'xs:block sm:hidden'
        } block flex items-center ${
          status === Phase.Off ? '' : 'cursor-not-allowed'
        }`}
      >
        <Button
          className={`${
            status === Phase.Off ? '' : 'pointer-events-none'
          } flex items-center justify-center p-0 border-0`}
          with={!extended ? 'link' : undefined}
          type={classFromPropsMobile()}
          shape="circle"
          size="middle"
          onClick={() => {
            setShow(true);
          }}
          disabled={status !== Phase.Off}
          icon={
            <SaveOutlined
              className="flex items-center justify-center"
              style={font22px}
            />
          }
        />
      </div>
    </Tooltip>
  </>
  ;
};

export default RowInstanceActionsPersistent;
