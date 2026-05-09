package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface CmChattRoomMapper {

    CmChattRoomDto.Item selectById(@Param("id") String id);

    List<CmChattRoomDto.Item> selectList(CmChattRoomDto.Request req);

    List<CmChattRoomDto.Item> selectPageList(CmChattRoomDto.Request req);

    long selectPageCount(CmChattRoomDto.Request req);

    int updateSelective(CmChattRoom entity);
}
