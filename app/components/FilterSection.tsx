'use client'

import { FilterState } from '../types'

interface FilterSectionProps {
  filterState: FilterState
  onFilter: () => void
  onShowAll: () => void
  isExpanded?: boolean
  onToggleExpanded?: () => void
}

export default function FilterSection({
  filterState,
  onFilter,
  onShowAll,
  isExpanded = false,
  onToggleExpanded
}: FilterSectionProps) {
  const { isFiltering, filterProgress, showAllPhotos, hasFace } = filterState

  return (
    <section id="upload">
      {/* モバイル用ヘッダー */}
      {onToggleExpanded && (
        <div className="upload-header" onClick={onToggleExpanded}>
          <h3>写真の絞り込み</h3>
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      )}
      
      <div className={`upload-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="filter-content-wrapper">
          <div className="filter-description">
            <dl>
              <dd>
                フォトギャラリー内の写真と登録された顔写真を照らし合わせ、一致した写真を絞り込んで表示します。
              </dd>
            </dl>
          </div>
          <div className="upload-button-container">
            <input 
              className="upload_btn" 
              type="button" 
              value={isFiltering ? "処理中..." : "写真を絞り込む"}
              onClick={onFilter}
              disabled={isFiltering || !hasFace}
            />
            {!showAllPhotos && (
              <input 
                className="upload_btn" 
                type="button" 
                value="全ての写真を表示"
                onClick={onShowAll}
              />
            )}
          </div>
        </div>
        
        {/* 進捗バー */}
        {isFiltering && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ 
              width: '100%', 
              backgroundColor: '#e9ecef', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${filterProgress}%`,
                height: '20px',
                backgroundColor: filterProgress < 50 ? '#ffc107' : filterProgress < 100 ? '#17a2b8' : '#28a745',
                transition: 'width 0.3s ease, background-color 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {Math.round(filterProgress)}%
              </div>
            </div>
            <div style={{ 
              textAlign: 'center', 
              marginTop: '5px', 
              fontSize: '14px', 
              color: '#6c757d' 
            }}>
              {filterProgress < 30 ? '顔認識システムを起動中...' :
               filterProgress < 60 ? '写真データベースを検索中...' :
               filterProgress < 90 ? '結果を整理中...' :
               '完了！'}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* アコーディオン形式のアップロードセクション */
        .upload-header {
          display: none;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
        }
        
        .upload-header:hover {
          background: #e9ecef;
        }
        
        .upload-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        
        .expand-icon {
          transition: transform 0.3s ease;
          color: #6c757d;
        }
        
        .expand-icon.expanded {
          transform: rotate(180deg);
        }
        
        .upload-content {
          max-height: none;
          overflow: visible;
          transition: max-height 0.3s ease, padding 0.3s ease;
          padding: 20px;
        }
        
        .filter-content-wrapper {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .filter-description {
          flex: 1;
        }
        
        .upload-button-container {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }
        
        @media (max-width: 768px) {
          .upload-header {
            display: flex;
          }
          
          .upload-content {
            max-height: 0;
            overflow: hidden;
            padding: 0 20px;
          }
          
          .upload-content.expanded {
            max-height: 500px;
            padding: 20px;
          }
          
          .filter-content-wrapper {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
          }
          
          .upload-button-container {
            justify-content: center;
            margin-top: 10px;
          }
        }
      `}</style>
    </section>
  )
} 