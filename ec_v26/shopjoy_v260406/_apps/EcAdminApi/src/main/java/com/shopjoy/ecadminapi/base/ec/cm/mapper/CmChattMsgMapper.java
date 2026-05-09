package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface CmChattMsgMapper {

    CmChattMsgDto.Item selectById(@Param("id") String id);

    List<CmChattMsgDto.Item> selectList(CmChattMsgDto.Request req);

    List<CmChattMsgDto.Item> selectPageList(CmChattMsgDto.Request req);

    long selectPageCount(CmChattMsgDto.Request req);

    int updateSelective(CmChattMsg entity);
}
