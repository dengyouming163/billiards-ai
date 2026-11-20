<?php

namespace app\storeapi\logic\mobile;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Employee;
use app\common\model\merchant\AssistantProfile;
use app\common\model\merchant\AssistantService;
use think\facade\Db;

class ProfileLogic extends BaseLogic
{
    public static function getProfile($userId, $storeId)
    {
        $employee = Employee::where('id', $userId)->find();
        
        if (!$employee) {
            return null;
        }
        
        $profile = AssistantProfile::where('employee_id', $userId)->find();
        
        if (!$profile) {
            $profile = new AssistantProfile();
            $profile->id = md5(bin2hex(random_bytes(8)));
            $profile->employee_id = $userId;
            $profile->store_id = $storeId;
            $profile->nickname = $employee->name ?: '';
            $profile->avatar = $employee->avatar ?: '';
            $profile->signature = '';
            $profile->tags = [];
            $profile->album = [];
            $profile->save();
        }
        
        $services = AssistantService::where('employee_id', $userId)
            ->where('status', 1)
            ->order('sort_order', 'asc')
            ->order('created_at', 'desc')
            ->select();
        
        $serviceList = [];
        foreach ($services as $service) {
            $serviceList[] = [
                'id' => $service->id,
                'icon' => $service->icon,
                'name' => $service->name,
                'description' => $service->description,
                'price' => (string)$service->price,
                'unit' => $service->unit
            ];
        }
        
        return [
            'id' => $profile->id,
            'name' => $employee->name ?: '',
            'phone' => $employee->phone ?: '',
            'role' => $employee->role ?: '',
            'store_name' => '',
            'join_time' => $employee->hire_date ?: '',
            'avatar' => $profile->avatar ?: '',
            'nickname' => $profile->nickname ?: '',
            'signature' => $profile->signature ?: '',
            'tags' => $profile->tags ?: [],
            'album' => $profile->album ?: [],
            'services' => $serviceList,
            'today_income' => 0,
            'today_orders' => 0,
            'today_duration' => 0
        ];
    }

    public static function updateProfile($userId, $data)
    {
        $profile = AssistantProfile::where('employee_id', $userId)->find();
        
        if (!$profile) {
            return false;
        }
        
        if (isset($data['nickname'])) {
            $profile->nickname = $data['nickname'];
        }
        if (isset($data['signature'])) {
            $profile->signature = $data['signature'];
        }
        if (isset($data['avatar'])) {
            $profile->avatar = $data['avatar'];
        }
        if (isset($data['tags'])) {
            $profile->tags = $data['tags'];
        }
        
        $profile->save();
        
        return true;
    }

    public static function uploadAlbum($userId, $filePath)
    {
        $profile = AssistantProfile::where('employee_id', $userId)->find();
        
        if (!$profile) {
            return null;
        }
        
        $album = $profile->album ?: [];
        $album[] = $filePath;
        $profile->album = $album;
        $profile->save();
        
        return ['url' => $filePath];
    }

    public static function deleteAlbum($userId, $url)
    {
        $profile = AssistantProfile::where('employee_id', $userId)->find();
        
        if (!$profile) {
            return false;
        }
        
        $album = $profile->album ?: [];
        $album = array_filter($album, function($item) use ($url) {
            return $item !== $url;
        });
        $profile->album = array_values($album);
        $profile->save();
        
        return true;
    }
    
    public static function saveService($userId, $storeId, $data)
    {
        $serviceId = $data['id'] ?? null;
        
        if ($serviceId) {
            $service = AssistantService::where('id', $serviceId)
                ->where('employee_id', $userId)
                ->find();
            if (!$service) {
                return null;
            }
        } else {
            $service = new AssistantService();
            $service->id = md5(bin2hex(random_bytes(8)));
            $service->employee_id = $userId;
            $service->store_id = $storeId;
        }
        
        $service->icon = $data['icon'] ?? '👨‍🏫';
        $service->name = $data['name'] ?? '';
        $service->description = $data['description'] ?? '';
        $service->price = $data['price'] ?? 0;
        $service->unit = $data['unit'] ?? '小时';
        $service->sort_order = $data['sort_order'] ?? 0;
        $service->status = 1;
        $service->save();
        
        return $service->toArray();
    }
    
    public static function deleteService($userId, $serviceId)
    {
        $service = AssistantService::where('id', $serviceId)
            ->where('employee_id', $userId)
            ->find();
            
        if (!$service) {
            return false;
        }
        
        $service->delete();
        
        return true;
    }
}
