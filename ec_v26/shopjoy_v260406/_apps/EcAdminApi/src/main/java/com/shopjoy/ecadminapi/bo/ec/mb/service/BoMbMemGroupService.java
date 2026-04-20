package com.shopjoy.ecadminapi.bo.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberGroupMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberGroupRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoMbMemGroupService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final MbMemberGroupMapper mapper;
    private final MbMemberGroupRepository repository;

    @Transactional(readOnly = true)
    public List<MbMemberGroupDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<MbMemberGroupDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public MbMemberGroupDto getById(String id) {
        MbMemberGroupDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public MbMemberGroup create(MbMemberGroup body) {
        body.setGroupId("MG" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.currentUserId());
        body.setRegDate(LocalDateTime.now());
        return repository.save(body);
    }

    @Transactional
    public MbMemberGroupDto update(String id, MbMemberGroup body) {
        MbMemberGroup entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        repository.save(entity);
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        repository.deleteById(id);
    }
}
