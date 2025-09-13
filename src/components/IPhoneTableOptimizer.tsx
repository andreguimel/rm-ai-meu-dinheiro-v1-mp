import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Smartphone, Monitor } from 'lucide-react';

interface IPhoneTableOptimizerProps {
  children: React.ReactNode;
  data: any[];
  itemsPerPage?: number;
  mobileCardRenderer?: (item: any, index: number) => React.ReactNode;
  title?: string;
  className?: string;
}

const detectPhysicalIPhone = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isStandalone = (window.navigator as any).standalone === true;
  const isInAppBrowser = /crios|fxios|opios/.test(userAgent);
  
  // Detecta iPhone físico vs simulador
  const isPhysicalDevice = isIOS && (
    isStandalone || 
    isInAppBrowser ||
    window.DeviceMotionEvent !== undefined ||
    'ontouchstart' in window
  );
  
  return isPhysicalDevice;
};

export const IPhoneTableOptimizer: React.FC<IPhoneTableOptimizerProps> = ({
  children,
  data,
  itemsPerPage = 10,
  mobileCardRenderer,
  title,
  className = ''
}) => {
  const [isPhysicalIPhone, setIsPhysicalIPhone] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileView, setShowMobileView] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const isPhysical = detectPhysicalIPhone();
    setIsPhysicalIPhone(isPhysical);
    setShowMobileView(isPhysical);
  }, []);

  // Paginação para iPhone físico
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  const renderMobileCards = () => {
    if (!mobileCardRenderer) {
      return (
        <div className="space-y-3">
          {paginatedData.map((item, index) => (
            <Card key={index} className="p-3 border border-gray-200">
              <CardContent className="p-0">
                <div className="text-sm text-gray-600">
                  Item {startIndex + index + 1} de {data.length}
                </div>
                <pre className="text-xs mt-2 overflow-x-auto">
                  {JSON.stringify(item, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {paginatedData.map((item, index) => 
          mobileCardRenderer(item, startIndex + index)
        )}
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center space-x-2 mt-4 pb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </Button>
        <span className="text-sm text-gray-600">
          Página {currentPage} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          Próxima
        </Button>
      </div>
    );
  };

  if (!isPhysicalIPhone) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileView(!showMobileView)}
              className="flex items-center space-x-1"
            >
              {showMobileView ? (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span>Móvel</span>
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4" />
                  <span>Desktop</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {showMobileView ? (
        <div>
          <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            📱 Visualização otimizada para iPhone • {data.length} itens
          </div>
          
          {!isExpanded && data.length > itemsPerPage ? (
            <div>
              <Button
                variant="outline"
                onClick={() => setIsExpanded(true)}
                className="w-full mb-4 flex items-center justify-center space-x-2"
              >
                <ChevronDown className="w-4 h-4" />
                <span>Mostrar todos os {data.length} itens</span>
              </Button>
              {renderMobileCards()}
            </div>
          ) : (
            <div>
              {data.length > itemsPerPage && (
                <Button
                  variant="outline"
                  onClick={() => setIsExpanded(false)}
                  className="w-full mb-4 flex items-center justify-center space-x-2"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>Mostrar com paginação</span>
                </Button>
              )}
              {isExpanded ? (
                <div className="space-y-3">
                  {data.map((item, index) => 
                    mobileCardRenderer ? 
                      mobileCardRenderer(item, index) : 
                      (
                        <Card key={index} className="p-3 border border-gray-200">
                          <CardContent className="p-0">
                            <div className="text-sm text-gray-600">
                              Item {index + 1} de {data.length}
                            </div>
                            <pre className="text-xs mt-2 overflow-x-auto">
                              {JSON.stringify(item, null, 2)}
                            </pre>
                          </CardContent>
                        </Card>
                      )
                  )}
                </div>
              ) : (
                renderMobileCards()
              )}
            </div>
          )}
          
          {!isExpanded && renderPagination()}
        </div>
      ) : (
        <div>
          <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            🖥️ Visualização desktop no iPhone • Pode ser lenta
          </div>
          {children}
        </div>
      )}
    </div>
  );
};