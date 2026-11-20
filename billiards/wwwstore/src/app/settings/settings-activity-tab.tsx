'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { get, post, put, del } from '@/lib/api/client';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface Activity {
  id: string; title: string; image: string; icon: string; tag: string;
  discount: string; start_time: string; end_time: string; status: number; sort: number;
}

export function SettingsActivityTab() {
  const [list, setList] = useState<Activity[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState({ title:'', image:'', icon:'🎁', tag:'', discount:'', start_time:'', end_time:'', status:1, sort:0 });

  const loadList = async () => {
    const res: any = await get('/activity.Activity/lists');
    setList(res?.data?.list || res?.list || []);
  };

  useEffect(() => { loadList(); }, []);

  const openCreate = () => { setEditing(null); setForm({ title:'', image:'', icon:'🎁', tag:'', discount:'', start_time:'', end_time:'', status:1, sort:0 }); setDialogOpen(true); };
  const openEdit = (a: Activity) => { setEditing(a); setForm(a); setDialogOpen(true); };

  const handleSave = async () => {
    if (editing) {
      await put(`/activity.Activity/update/${editing.id}`, form);
    } else {
      await post('/activity.Activity/create', form);
    }
    setDialogOpen(false);
    loadList();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除？')) return;
    await del(`/activity.Activity/delete/${id}`);
    loadList();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>活动管理</CardTitle>
        <Button onClick={openCreate} size="sm" className="ml-auto"><Plus className="w-4 h-4 mr-1"/>新增活动</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>标题</TableHead><TableHead>标签</TableHead><TableHead>优惠</TableHead><TableHead>时间</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.map(a => (
              <TableRow key={a.id}>
                <TableCell>{a.title}</TableCell>
                <TableCell><Badge variant="outline">{a.tag || '-'}</Badge></TableCell>
                <TableCell>{a.discount || '-'}</TableCell>
                <TableCell className="text-xs">{a.start_time?.slice(0,10)} ~ {a.end_time?.slice(0,10)}</TableCell>
                <TableCell><Badge variant={a.status===1?'default':'secondary'}>{a.status===1?'启用':'禁用'}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={()=>openEdit(a)}><Pencil className="w-3 h-3"/></Button>
                  <Button variant="ghost" size="sm" onClick={()=>handleDelete(a.id)}><Trash2 className="w-3 h-3 text-red-500"/></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?'编辑活动':'新增活动'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="标题" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
            <Input placeholder="封面图URL" value={form.image} onChange={e=>setForm({...form,image:e.target.value})}/>
            <div className="flex gap-2">
              <Input placeholder="图标" value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})} className="w-24"/>
              <Input placeholder="标签" value={form.tag} onChange={e=>setForm({...form,tag:e.target.value})}/>
              <Input placeholder="优惠信息" value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})}/>
            </div>
            <div className="flex gap-2">
              <Input type="datetime-local" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/>
              <Input type="datetime-local" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})}/>
            </div>
            <div className="flex gap-2">
              <select value={form.status} onChange={e=>setForm({...form,status:Number(e.target.value)})} className="border rounded p-2">
                <option value={1}>启用</option><option value={0}>禁用</option>
              </select>
              <Input type="number" placeholder="排序" value={form.sort} onChange={e=>setForm({...form,sort:Number(e.target.value)})} className="w-24"/>
            </div>
            <Button onClick={handleSave} className="w-full">保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
