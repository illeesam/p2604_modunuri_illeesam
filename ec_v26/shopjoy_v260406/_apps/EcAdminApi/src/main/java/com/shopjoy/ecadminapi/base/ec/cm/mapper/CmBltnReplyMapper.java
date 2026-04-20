package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBltnReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltnReply;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CmBltnReplyMapper {

    CmBltnReplyDto selectById(@Param("id") String id);

    List<CmBltnReplyDto> selectList(@Param("p") Map<String, Object> p);

    List<CmBltnReplyDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(CmBltnReply entity);
}
