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
      {/* PC版: サンプルファイルの構造に合わせる */}
      <div className="upload-pc">
        <dl>
          <dt>写真の絞り込み</dt>
          <dd>
            フォトギャラリー内の写真と登録された顔写真を照らし合わせ、一致した写真を絞り込んで表示します。
          </dd>
        </dl>
        <div className="button-progress-container">
          <input 
            className="upload_btn" 
            type="button" 
            value={isFiltering ? "処理中..." : showAllPhotos ? "写真を絞り込む" : "全ての写真を表示"}
            onClick={showAllPhotos ? onFilter : onShowAll}
            disabled={isFiltering || (!hasFace && showAllPhotos)}
          />
          
          {/* 進捗バー */}
          {isFiltering && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${filterProgress}%` }}
                >
                  {Math.round(filterProgress)}%
                </div>
              </div>
              <div className="progress-text">
                {filterProgress < 20 ? '顔認識システムを起動中...' :
                 filterProgress < 40 ? '写真データベースを検索中...' :
                 filterProgress < 80 ? '結果を整理中...' :
                 '完了！'}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* スマホ版: 現在の構造を維持 */}
      <div className="upload-mobile">
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
                value={isFiltering ? "処理中..." : showAllPhotos ? "写真を絞り込む" : "全ての写真を表示"}
                onClick={showAllPhotos ? onFilter : onShowAll}
                disabled={isFiltering || (!hasFace && showAllPhotos)}
              />
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
                {filterProgress < 20 ? '顔認識システムを起動中...' :
                 filterProgress < 40 ? '写真データベースを検索中...' :
                 filterProgress < 80 ? '結果を整理中...' :
                 '完了！'}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* PC版とスマホ版の制御 */
        .upload-pc {
          display: none;
        }
        
        .upload-mobile {
          display: block;
        }
        
        /* PC版: サンプルファイルのCSSを完全に適用 */
        @media (min-width: 769px) {
          .upload-pc {
            display: block;
          }
          
          .upload-mobile {
            display: none;
          }
          
          .upload-pc {
            padding: 30px;
            background: #F8F2E1;
            display: flex;
          }
          
          .upload-pc > dl {
            flex: 1;
            display: flex;
          }
          
          .upload-pc > dl > dt {
            width: 10em;
            margin-right: 30px;
            font-weight: 500;
            border-left: #707070 1px solid;
            border-right: #707070 1px solid;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .upload-pc > dl > dd {
            font-size: 1.5rem;
            flex: 1;
          }
          
          .button-progress-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-left: 30px;
            width: 220px;
          }
          
          .upload-pc .upload_btn {
            width: 220px;
            font-size: 1.6rem;
            font-weight: 700;
            font-family: "Noto Sans JP", sans-serif;
            color: #fff;
            border: #AE9145 2px solid;
            border-radius: 5px;
            background: #AE9145;
            transition: 0.5s;
            cursor: pointer;
          }
          
          .upload-pc .upload_btn:hover {  
            color: #AE9145;
            background: #fff;
          }
          
          .upload-pc .upload_btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .upload-pc .upload_btn:disabled:hover {
            color: #fff;
            background: #AE9145;
          }
          
          .progress-container {
            margin-top: 20px;
            width: 100%;
          }
          
          .progress-bar {
            width: 100%;
            background-color: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            height: 20px;
          }
          
          .progress-fill {
            height: 100%;
            background-color: #28a745;
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
          }
          
          .progress-text {
            text-align: center;
            margin-top: 5px;
            font-size: 14px;
            color: #6c757d;
          }
        }
        
        /* スマホ版: 現在のアコーディオン形式を維持 */
        .upload-header {
          display: none;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: #ffffff;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid #e9ecef;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .upload-header:hover {
          background: #f8f9fa;
          border-color: #007bff;
        }
        
        .upload-header h3 {
          margin: 0;
          font-size: 20px;
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