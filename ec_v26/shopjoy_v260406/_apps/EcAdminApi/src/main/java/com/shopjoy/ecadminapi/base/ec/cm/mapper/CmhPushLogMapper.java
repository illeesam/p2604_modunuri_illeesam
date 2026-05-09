package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmhPushLogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmhPushLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface CmhPushLogMapper {

    CmhPushLogDto.Item selectById(@Param("id") String id);

    List<CmhPushLogDto.Item> selectList(CmhPushLogDto.Request req);

    List<CmhPushLogDto.Item> selectPageList(CmhPushLogDto.Request req);

    long selectPageCount(CmhPushLogDto.Request req);

    int updateSelective(CmhPushLog entity);
}
