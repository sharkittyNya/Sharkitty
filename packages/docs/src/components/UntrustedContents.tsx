import Link from '@docusaurus/Link'
import Admonition from '@theme/Admonition'

export const UntrustedContents = () => (
  <div>
    <Admonition type="caution">
      <p>
        下面的一些内容不由 Chronocat
        管理，你应当前往对应项目以获得最新、最详细的教程。<br></br>
        如果你遇到了任何问题，你都可以通过 <Link to="/community">
          社区
        </Link>{' '}
        途径寻求帮助。
      </p>
    </Admonition>
  </div>
)
