import React, {useEffect} from 'react';
import {useHistory} from '@docusaurus/router';

export default function DemosRedirect(): React.ReactElement | null {
  const history = useHistory();
  useEffect(() => {
    history.replace('/docs/demos');
  }, [history]);
  return null;
}

