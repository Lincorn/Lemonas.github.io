/* global CONFIG */

(function() {
  'use strict';

  function localSearchFunc(path, searchSelector, resultSelector) {
    const $input = jQuery(searchSelector);
    const $result = jQuery(resultSelector);

    if ($input.length === 0 || $result.length === 0) {
      throw new Error('搜索输入框或结果容器未找到');
    }

    $input.on('input', function() {
      const keywords = $input.val().trim().toLowerCase().split(/[\s-]+/);

      if (keywords.length === 0 || keywords[0] === '') {
        $input.removeClass('valid').removeClass('invalid');
        $result.empty();
        return;
      }

      if ($result.attr('class').indexOf('list-group-item') === -1) {
        $result.html('<div class="m-auto text-center"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div><br/>Loading...</div>');
      }

      jQuery.ajax({
        url: path,
        dataType: 'xml',
        success: function(xml) {
          const entries = jQuery('entry', xml).map(function() {
            return {
              title: jQuery('title', this).text(),
              content: jQuery('content', this).text(),
              url: jQuery('url', this).text()
            };
          }).get();

          let resultHTML = '';
          entries.forEach(entry => {
            const entryTitle = entry.title.toLowerCase();
            const entryContent = entry.content.toLowerCase();
            const entryUrl = entry.url;
            let isMatch = true;

            keywords.forEach(keyword => {
              if (entryTitle.indexOf(keyword) === -1 && entryContent.indexOf(keyword) === -1) {
                isMatch = false;
              }
            });

            if (isMatch) {
              resultHTML += `
                <a href="${entryUrl}" class="list-group-item list-group-item-action font-weight-bolder search-list-title">${entry.title}</a>
                <p class="search-list-content">${highlightKeywords(entry.content, keywords)}...</p>
              `;
            }
          });

          if (resultHTML === '') {
            $input.addClass('invalid').removeClass('valid');
            $result.html('<p class="text-center">未找到相关结果</p>');
          } else {
            $input.addClass('valid').removeClass('invalid');
            $result.html(resultHTML);
          }
        },
        error: function() {
          $result.html('<p class="text-center">加载搜索数据失败，请稍后重试。</p>');
        }
      });
    });
  }

  function highlightKeywords(content, keywords) {
    let highlightedContent = content.substring(0, 100); // 截取前 100 个字符
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      highlightedContent = highlightedContent.replace(regex, `<span class="search-word">${keyword}</span>`);
    });
    return highlightedContent;
  }

  function localSearchReset(searchSelector, resultSelector) {
    const $input = jQuery(searchSelector);
    const $result = jQuery(resultSelector);
    $input.val('').removeClass('valid invalid');
    $result.html('');
  }

  const modal = jQuery('#modalSearch');
  const searchSelector = '#local-search-input';
  const resultSelector = '#local-search-result';

  modal.on('show.bs.modal', function() {
    const path = CONFIG.search_path || '/local-search.xml'; // 动态读取搜索数据路径
    localSearchFunc(path, searchSelector, resultSelector);
  });

  modal.on('hidden.bs.modal', function() {
    localSearchReset(searchSelector, resultSelector);
  });
})();
