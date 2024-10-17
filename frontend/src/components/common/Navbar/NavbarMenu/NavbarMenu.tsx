import { CaretDownOutlined, LogoutOutlined } from '@ant-design/icons';
import { Dropdown, Space } from 'antd';
import Button from 'antd-button-color';
import { FC, useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TenantContext } from '../../../../contexts/TenantContext';
import { generateAvatarUrl } from '../../../../utils';
import { RouteData } from '../Navbar';
import { useAuth } from 'react-oidc-context';
import { MenuProps } from 'antd/lib';

export interface INavbarMenuProps {
  routes: Array<RouteData>;
}

const NavbarMenu: FC<INavbarMenuProps> = ({ ...props }) => {
  const auth = useAuth();

  const { routes } = props;
  const { data } = useContext(TenantContext);
  const tenantId = data?.tenant?.metadata?.name ?? '[?]';
  const currentPath = useLocation().pathname;

  const [visible, setVisible] = useState(false);

  const handleMenuClick = (e: { key: string }) => {
    if (e.key !== 'welcome') setVisible(false);
  };

  const handleVisibleChange = (flag: boolean) => {
    setVisible(flag);
  };

  const userIcon = (
    <svg viewBox="0 0 150 150" width="35" height="35">
      <image href={generateAvatarUrl('bottts', tenantId ?? '')} />
    </svg>
  );

  const items: MenuProps['items'] = [
    {
      key: 'welcome',
      className: 'pointer-events-none text-center',
      label: (
        <>
          Logged in as <b>{tenantId}</b>
        </>
      ),
    },
    ...routes.map(r => {
      const isExtLink = r.path.indexOf('http') === 0;
      return {
        key: r.path,
        label: (
          <Link
            target={isExtLink ? '_blank' : ''}
            key={r.path}
            to={{ pathname: isExtLink ? '' : r.path }}
            rel={isExtLink ? 'noopener noreferrer' : ''}
          >
            <Space size="small">
              {r.navbarMenuIcon}
              {r.name}
            </Space>
          </Link>
        ),
      };
    }),
    {
      key: 'logout',
      onClick: () => auth.signoutSilent(),
      icon: <LogoutOutlined />,
      title: 'Logout',
    },
  ];

  return (
    <div className="flex justify-center items-center">
      <Dropdown
        overlayClassName="pt-1 pr-2 2xl:pr-0"
        open={visible}
        onOpenChange={handleVisibleChange}
        placement="bottom"
        trigger={['click']}
        menu={{ items, onClick: handleMenuClick }}
      >
        <Button
          className="flex justify-center items-center px-2 ml-1 "
          type={routes.find(r => r.path === currentPath) ? 'primary' : 'text'}
          shape="round"
          size="large"
          icon={userIcon}
        >
          <div className="2xl:flex hidden items-center ml-2">
            {`${data?.tenant?.spec?.firstName} ${data?.tenant?.spec?.lastName}`}
          </div>
          <CaretDownOutlined
            className="flex items-center ml-2"
            style={{ fontSize: '15px' }}
          />
        </Button>
      </Dropdown>
    </div>
  );
};

export default NavbarMenu;
