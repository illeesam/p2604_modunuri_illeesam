package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;
import com.shopjoy.ecadminapi.base.sy.mapper.SyPathMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyPathService {

    private final SyPathMapper syPathMapper;
    private final SyPathRepository syPathRepository;

    @Transactional(readOnly = true)
    public SyPathDto getById(String id) {
        return syPathMapper.selectById(id);
    }

    @Transactional(readOnly = true)
    public List<SyPathDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syPathMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyPathDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syPathMapper.selectPageList(p), syPathMapper.selectPageCount(p),
                PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public SyPath create(SyPath entity) {
        entity.setPathId(CmUtil.generateId("sy_path"));
        entity.setRegBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        entity.setUpdDate(LocalDateTime.now());
        return syPathRepository.save(entity);
    }

    @Transactional
    public SyPath save(String id, SyPath entity) {
        if (!syPathRepository.existsById(id))
            throw new CmBizException("존재하지 않는 SyPath입니다: " + id);
        entity.setPathId(id);
        entity.setUpdBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        entity.setUpdDate(LocalDateTime.now());
        return syPathRepository.save(entity);
    }

    @Transactional
    public int update(String id, SyPath entity) {
        entity.setPathId(id);
        return syPathMapper.updateSelective(entity);
    }

    @Transactional
    public void delete(String id) {
        if (!syPathRepository.existsById(id))
            throw new CmBizException("존재하지 않는 SyPath입니다: " + id);
        syPathRepository.deleteById(id);
    }

    @Transactional
    public void saveList(List<SyPath> rows) {
        String authId = CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system");
        LocalDateTime now = LocalDateTime.now();
        for (SyPath row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setPathId(CmUtil.generateId("sy_path"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syPathRepository.save(row);
            } else if ("U".equals(rs)) {
                String pid = row.getPathId();
                if (pid == null) throw new CmBizException("수정 시 pathId는 필수입니다.");
                SyPath entity = syPathRepository.findById(pid)
                    .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + pid));
                entity.setBizCd(row.getBizCd());
                entity.setParentPathId(row.getParentPathId());
                entity.setPathLabel(row.getPathLabel());
                entity.setSortOrd(row.getSortOrd());
                entity.setUseYn(row.getUseYn());
                entity.setPathRemark(row.getPathRemark());
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syPathRepository.save(entity);
            } else if ("D".equals(rs)) {
                String pid = row.getPathId();
                if (pid != null && syPathRepository.existsById(pid)) syPathRepository.deleteById(pid);
            }
        }
    }
}
