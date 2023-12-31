import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  guide: [
    {
      type: 'category',
      label: '安装',
      link: {
        type: 'doc',
        id: 'install/index',
      },
      items: [
        {
          type: 'category',
          label: '本机安装',
          link: {
            type: 'doc',
            id: 'install/native',
          },
          items: [
            'install/llqqnt',
            'install/llqqnt-airgap',
            'install/qqntim',
            'install/qqntim-airgap',
            'install/launcher',
          ],
        },
        {
          type: 'category',
          label: 'Docker',
          link: {
            type: 'doc',
            id: 'install/docker/index',
          },
          items: [
            {
              type: 'category',
              label: '官方镜像',
              link: {
                type: 'doc',
                id: 'install/docker/official/index',
              },
              items: ['install/docker/official/reference'],
            },
            'install/docker/community',
          ],
        },
        'install/phone/index',
        'install/trusted-installation',
      ],
    },
    'launch/index',
    {
      type: 'category',
      label: '接入',
      link: {
        type: 'doc',
        id: 'connect/index',
      },
      items: [
        'connect/koishi',
        'connect/nonebot',
        'connect/avilla',
        'connect/kiramibot',
      ],
    },
    {
      type: 'category',
      label: '配置',
      link: {
        type: 'doc',
        id: 'config/index',
      },
      items: ['config/reference'],
    },
  ],
  developSatori: [
    'develop/satori/index',
    'develop/satori/quickstart',
    'develop/satori/fundamentals',
    {
      type: 'category',
      label: '参考',
      link: {
        type: 'doc',
        id: 'develop/satori/reference/index',
      },
      items: [
        {
          type: 'link',
          label: 'API',
          href: '/develop/satori/reference/api',
        },
      ],
    },
  ],
  developRed: [
    {
      type: 'autogenerated',
      dirName: 'develop/red',
    },
  ],
  contributeCore: [
    {
      type: 'autogenerated',
      dirName: 'contribute/core',
    },
  ],
  contributeTdd: [
    {
      type: 'autogenerated',
      dirName: 'contribute/tdd',
    },
  ],
  contributeNative: [
    {
      type: 'autogenerated',
      dirName: 'contribute/native',
    },
  ],
  faq: [
    {
      type: 'autogenerated',
      dirName: 'faq',
    },
  ],
  more: [
    {
      type: 'autogenerated',
      dirName: 'more',
    },
  ],
}

export = sidebars
