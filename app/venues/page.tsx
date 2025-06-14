'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, MapPin, Users, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Venue {
  id: number;
  name: string;
  createdAt: string;
  photoCount?: number;
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
  const [faceRegistrationOpen, setFaceRegistrationOpen] = useState(false);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [faceUploading, setFaceUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // 認証チェック
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole') as 'user' | 'admin' | null;
    
    if (!token || !role) {
      router.push('/');
      return;
    }
    
    setUserRole(role);
    fetchVenues();
  }, [router]);

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/venues');
      const data = await response.json();

      if (data.success) {
        // 各会場の写真枚数も取得
        const venuesWithCounts = await Promise.all(
          data.venues.map(async (venue: Venue) => {
            try {
              const photosResponse = await fetch(`/api/venues/${venue.id}/photos/count`);
              const photosData = await photosResponse.json();
              return {
                ...venue,
                photoCount: photosData.success ? photosData.count : 0
              };
            } catch {
              return { ...venue, photoCount: 0 };
            }
          })
        );
        setVenues(venuesWithCounts);
      } else {
        setError('会場の取得に失敗しました');
      }
    } catch (err) {
      setError('データの取得中にエラーが発生しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceUpload = async () => {
    if (!faceFile) return;

    setFaceUploading(true);
    const formData = new FormData();
    formData.append('face', faceFile);

    try {
      const response = await fetch('/api/faces/register', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '顔写真を登録しました',
          description: '写真の絞り込み機能が利用できるようになりました。',
        });
        setFaceRegistrationOpen(false);
        setFaceFile(null);
      } else {
        toast({
          title: 'エラーが発生しました',
          description: data.message || '顔写真の登録に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'エラーが発生しました',
        description: '顔写真の登録中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setFaceUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">会場情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">写真管理システム</h1>
            </div>
            
            <Dialog open={faceRegistrationOpen} onOpenChange={setFaceRegistrationOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  顔写真登録
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>顔写真登録</DialogTitle>
                  <DialogDescription>
                    顔がはっきり写っている正面向きの写真を使用してください。一度登録すると、その顔で写真の絞り込みができるようになります。
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">顔写真をアップロード</p>
                    <p className="text-xs text-gray-500 mb-4">クリックして選択</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFaceFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>登録のコツ:</strong> 顔がはっきり写っている正面向きの写真を使用してください。一度登録すると、その顔で写真の絞り込みができるようになります。
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleFaceUpload} 
                    disabled={!faceFile || faceUploading}
                    className="w-full"
                  >
                    {faceUploading ? '登録中...' : '顔写真を登録'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">メインページ</h2>
          <p className="text-gray-600">写真を閲覧したい会場を選択してください</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {venues.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MapPin className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">会場がありません</h3>
            <p className="text-gray-600">管理者が会場を追加するまでお待ちください。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <Card key={venue.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <MapPin className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{venue.name}</CardTitle>
                  <CardDescription className="text-lg font-semibold text-blue-600">
                    {venue.photoCount || 0}枚
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/venues/${venue.id}`}>
                    <Button className="w-full" size="lg">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      写真を見る
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
