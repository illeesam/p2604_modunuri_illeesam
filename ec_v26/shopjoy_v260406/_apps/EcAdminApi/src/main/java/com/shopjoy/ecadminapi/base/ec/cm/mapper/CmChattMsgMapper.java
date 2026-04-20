package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CmChattMsgMapper {

    CmChattMsgDto selectById(@Param("id") String id);

    List<CmChattMsgDto> selectList(@Param("p") Map<String, Object> p);

    List<CmChattMsgDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(CmChattMsg entity);
}
