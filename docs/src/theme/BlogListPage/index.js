import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { getIcon } from '../../icons/icons';

export default function BlogListPage(props) {
  const {items, metadata} = props;

  // Aggregate unique tags across all posts, preserve first-appearance order
  const tagMap = new Map();
  items.forEach(({content}) => {
    (content?.metadata?.tags || []).forEach((t) => {
      if (!tagMap.has(t.permalink)) tagMap.set(t.permalink, t);
    });
  });
  const allTags = Array.from(tagMap.values());

  const [selectedTagPermalink, setSelectedTagPermalink] = React.useState(null);
  const filteredItems = React.useMemo(() => {
    if (!selectedTagPermalink) return items;
    return items.filter(({content}) =>
      (content?.metadata?.tags || []).some((t) => t.permalink === selectedTagPermalink),
    );
  }, [items, selectedTagPermalink]);

  return (
    <Layout title={metadata?.title} description={metadata?.description}>
      <main className="container margin-vert--lg">
        <header className="margin-bottom--lg">
          <h1>ToolJump Integrations</h1>
          <p className="intro-text">
            ToolJump integrations are JavaScript modules that run in response to specific contexts and return structured data that can be displayed in the browser. This section covers everything you need to know to create your own integrations.
          </p>
        </header>

        {allTags.length > 0 && (
          <section className="integrations-tags margin-bottom--lg" aria-label="Tags">
            {allTags.map((tag) => {
              const active = selectedTagPermalink === tag.permalink;
              return (
                <button
                  key={tag.permalink}
                  type="button"
                  className={`integrations-tag${active ? ' is-active' : ''}`}
                  onClick={() =>
                    setSelectedTagPermalink(active ? null : tag.permalink)
                  }
                >
                  #{tag.label}
                </button>
              );
            })}
            {selectedTagPermalink && (
              <button
                type="button"
                className="integrations-tag is-clear"
                onClick={() => setSelectedTagPermalink(null)}
              >
                Clear
              </button>
            )}
          </section>
        )}

        <section className="integrations-grid" aria-label="Integration Articles">
          {filteredItems.map(({content}) => {
            const m = content?.metadata || {};
            const fm = content?.frontMatter || {};
            const subtitle = fm.subtitle || fm.description || m.description || '';
            const icons = fm.icons || [];
            return (
              <Link key={m.permalink} to={m.permalink} className="integrations-card">
                <h3 className="integrations-card__title">{m.title}</h3>
                {icons.length > 0 && (
                  <div className="integrations-card__icons">
                    {icons.map((iconName, index) => {
                      const iconSrc = getIcon(iconName);
                      return iconSrc ? (
                        <img
                          key={index}
                          src={iconSrc}
                          alt={iconName}
                          className="integrations-card__icon"
                        />
                      ) : null;
                    })}
                  </div>
                )}
                {subtitle && <p className="integrations-card__subtitle">{subtitle}</p>}
              </Link>
            );
          })}
        </section>
      </main>
    </Layout>
  );
}
