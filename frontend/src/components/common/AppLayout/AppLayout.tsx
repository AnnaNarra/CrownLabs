import { InfoOutlined } from '@ant-design/icons';
import { Col, Layout, Result, Row } from 'antd';
import { FC, useContext, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { TenantContext } from '../../../contexts/TenantContext';
import { RouteDescriptor } from '../../../utils';
import FullPageLoader from '../FullPageLoader';
import Navbar from '../Navbar';
import SidebarInfo from '../SidebarInfo';
import TooltipButton from '../TooltipButton';
import { TooltipButtonData } from '../TooltipButton/TooltipButton';
import './AppLayout.less';
import { useAuth } from 'react-oidc-context';

const { Content } = Layout;

export interface IAppLayoutProps {
  routes: Array<RouteDescriptor>;
  TooltipButtonData?: TooltipButtonData;
  TooltipButtonLink?: string;
  transparentNavbar?: boolean;
}

const AppLayout: FC<IAppLayoutProps> = ({ ...props }) => {
  const auth = useAuth();

  const [sideLeftShow, setSideLeftShow] = useState(false);
  const { routes, transparentNavbar, TooltipButtonData, TooltipButtonLink } =
    props;

  const { data: tenantData } = useContext(TenantContext);
  const tenantNsIsReady =
    tenantData?.tenant?.status?.personalNamespace?.created ?? false;
  const tenantName = tenantData?.tenant?.spec?.firstName;

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Layout className="h-full">
        <Navbar
          logoutHandler={() =>
            auth.removeUser().then(() => auth.signoutRedirect())
          }
          routes={routes}
          transparent={transparentNavbar}
        />
        <Content className="flex">
          {tenantNsIsReady ? (
            <Routes>
              {routes
                .filter(r => r.content)
                .map(r => (
                  <Route
                    key={r.route.path}
                    path={r.route.path}
                    element={
                      <Row className="h-full pt-5 xs:pt-10 pb-20 flex w-full px-4">
                        <Col span={0} lg={1} xxl={2}></Col>
                        {r.content}
                        <Col span={0} lg={1} xxl={2}></Col>
                      </Row>
                    }
                  />
                ))}
              <Route
                element={
                  <div className="flex justify-center items-center w-full">
                    <Result
                      status="404"
                      title="404"
                      subTitle="Sorry, the page you visited does not exist."
                    />
                  </div>
                }
              />
            </Routes>
          ) : (
            <FullPageLoader
              text={`Welcome back ${tenantName}!`}
              subtext="Settings things back up... Hold tight!"
            />
          )}
        </Content>
        <div className="left-TooltipButton">
          <TooltipButton
            TooltipButtonData={{
              tooltipTitle: 'Show CrownLabs infos',
              tooltipPlacement: 'right',
              type: 'primary',
              icon: <InfoOutlined style={{ fontSize: '22px' }} />,
            }}
            onClick={() => setSideLeftShow(true)}
          />
        </div>
        {TooltipButtonData && (
          <div className="right-TooltipButton">
            <TooltipButton
              TooltipButtonData={{
                tooltipTitle: TooltipButtonData.tooltipTitle,
                tooltipPlacement: TooltipButtonData.tooltipPlacement,
                type: TooltipButtonData.type,
                icon: TooltipButtonData.icon,
              }}
              onClick={() => window.open(TooltipButtonLink, '_blank')}
            />
          </div>
        )}
      </Layout>
      <SidebarInfo
        show={sideLeftShow}
        setShow={setSideLeftShow}
        position="left"
      />
    </BrowserRouter>
  );
};

export default AppLayout;
