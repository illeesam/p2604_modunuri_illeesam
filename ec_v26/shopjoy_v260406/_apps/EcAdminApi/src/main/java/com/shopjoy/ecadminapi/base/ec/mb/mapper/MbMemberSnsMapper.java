package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberSnsDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface MbMemberSnsMapper {

    MbMemberSnsDto selectById(@Param("id") String id);

    List<MbMemberSnsDto> selectList(@Param("p") Map<String, Object> p);

    List<MbMemberSnsDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(MbMemberSns entity);
}
